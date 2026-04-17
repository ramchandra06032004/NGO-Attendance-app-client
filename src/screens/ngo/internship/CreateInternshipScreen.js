import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NavigationContext } from "../../../context/NavigationContext";
import { AuthContext } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import * as api from "../../../../apis/api";
import { ChevronLeft } from "lucide-react-native";

const DOMAINS = [
  "Teaching & Education",
  "Healthcare",
  "Environment",
  "Technology",
  "Social Work",
  "Agriculture",
  "Arts & Culture",
  "Legal Aid",
  "Other",
];

const Field = ({ label, value, onChangeText, placeholder, multiline, keyboardType, colors }) => (
  <View className="mb-4">
    <Text className="text-xs font-bold mb-1.5" style={{ color: colors.textSecondary }}>
      {label} <Text style={{ color: "#ef4444" }}>*</Text>
    </Text>
    <TextInput
      className="px-4 py-3 rounded-xl border"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        color: colors.textPrimary,
        minHeight: multiline ? 90 : undefined,
        textAlignVertical: multiline ? "top" : "center",
      }}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

export default function CreateInternshipScreen() {
  const { goBack, navigate } = useContext(NavigationContext);
  const { accessToken } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [form, setForm] = useState({
    title: "",
    description: "",
    domain: DOMAINS[0],
    location: "",
    stipend: "",
    totalSlots: "",
    spocName: "",
    spocContact: "",
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDomainPicker, setShowDomainPicker] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const formatDate = (date) => {
    if (!date) return "Select Date";
    return new Date(date).toLocaleDateString();
  };

  const handleSubmit = async () => {
    const { title, description, domain, location, totalSlots, spocName, spocContact } = form;

    if (!title || !description || !domain || !location || !totalSlots || !spocName || !spocContact) {
      Alert.alert("Missing Fields", "Please fill in all required fields");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("Missing Dates", "Please select start and end dates");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      Alert.alert("Invalid Dates", "End date must be after start date");
      return;
    }
    const slots = parseInt(totalSlots);
    if (isNaN(slots) || slots < 1) {
      Alert.alert("Invalid Slots", "Total slots must be a positive number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(api.ngoInternshipsAPI, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          description,
          domain,
          location,
          stipend: form.stipend || "Unpaid",
          totalSlots: slots,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          spocName,
          spocContact,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Internship created successfully!", [
          { text: "OK", onPress: () => goBack() },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to create internship");
      }
    } catch (err) {
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <View
      className="flex-1"
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) || "#eef2ff",
      }}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-5 pt-10 pb-4 border-b"
        style={{ borderBottomColor: colors.border, backgroundColor: colors.cardBg }}
      >
        <TouchableOpacity
          onPress={goBack}
          className="p-2 rounded-full mr-3 border"
          style={{ borderColor: colors.border }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-extrabold" style={{ color: colors.header }}>
            Create Internship
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Fill in the program details below
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Field
          label="Internship Title"
          value={form.title}
          onChangeText={(v) => update("title", v)}
          placeholder="e.g. Teaching Assistant Internship"
          colors={colors}
        />
        <Field
          label="Description"
          value={form.description}
          onChangeText={(v) => update("description", v)}
          placeholder="Describe the internship program..."
          multiline={true}
          colors={colors}
        />

        {/* Domain picker */}
        <View className="mb-4">
          <Text className="text-xs font-bold mb-1.5" style={{ color: colors.textSecondary }}>
            Domain <Text style={{ color: "#ef4444" }}>*</Text>
          </Text>
          <TouchableOpacity
            className="px-4 py-3 rounded-xl border flex-row justify-between items-center"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            onPress={() => setShowDomainPicker(!showDomainPicker)}
          >
            <Text style={{ color: colors.textPrimary }}>{form.domain}</Text>
            <Text style={{ color: colors.textSecondary }}>▼</Text>
          </TouchableOpacity>
          {showDomainPicker && (
            <View
              className="rounded-xl border mt-1 overflow-hidden"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
            >
              {DOMAINS.map((d) => (
                <TouchableOpacity
                  key={d}
                  className="px-4 py-3 border-b"
                  style={{ borderBottomColor: colors.border }}
                  onPress={() => {
                    update("domain", d);
                    setShowDomainPicker(false);
                  }}
                >
                  <Text
                    style={{
                      color: form.domain === d ? colors.accent : colors.textPrimary,
                      fontWeight: form.domain === d ? "bold" : "normal",
                    }}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Field
          label="Location"
          value={form.location}
          onChangeText={(v) => update("location", v)}
          placeholder="e.g. Mumbai, Maharashtra"
          colors={colors}
        />

        {/* Date pickers row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-xs font-bold mb-1.5" style={{ color: colors.textSecondary }}>
              Start Date <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={startDate ? startDate.toISOString().split("T")[0] : ""}
                onChange={(e) => e.target.value && setStartDate(new Date(e.target.value))}
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.cardBg,
                  color: colors.textPrimary,
                  fontSize: "14px",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <TouchableOpacity
                className="px-3 py-3 rounded-xl border"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={{ color: startDate ? colors.textPrimary : colors.textSecondary }}>
                  {formatDate(startDate)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold mb-1.5" style={{ color: colors.textSecondary }}>
              End Date <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={endDate ? endDate.toISOString().split("T")[0] : ""}
                onChange={(e) => e.target.value && setEndDate(new Date(e.target.value))}
                style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.cardBg,
                  color: colors.textPrimary,
                  fontSize: "14px",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <TouchableOpacity
                className="px-3 py-3 rounded-xl border"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={{ color: endDate ? colors.textPrimary : colors.textSecondary }}>
                  {formatDate(endDate)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {Platform.OS !== "web" && showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, d) => { setShowStartPicker(false); if (d) setStartDate(d); }}
          />
        )}
        {Platform.OS !== "web" && showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, d) => { setShowEndPicker(false); if (d) setEndDate(d); }}
          />
        )}

        {/* Row: Slots + Stipend */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field
              label="Total Slots"
              value={form.totalSlots}
              onChangeText={(v) => update("totalSlots", v)}
              placeholder="e.g. 5"
              keyboardType="numeric"
              colors={colors}
            />
          </View>
          <View className="flex-1">
            <View className="mb-4">
              <Text className="text-xs font-bold mb-1.5" style={{ color: colors.textSecondary }}>
                Stipend
              </Text>
              <TextInput
                className="px-4 py-3 rounded-xl border"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                placeholder="e.g. ₹5000/month"
                placeholderTextColor={colors.textSecondary}
                value={form.stipend}
                onChangeText={(v) => update("stipend", v)}
              />
            </View>
          </View>
        </View>

        <Field
          label="SPOC Name"
          value={form.spocName}
          onChangeText={(v) => update("spocName", v)}
          placeholder="Point of contact name"
          colors={colors}
        />
        <Field
          label="SPOC Contact"
          value={form.spocContact}
          onChangeText={(v) => update("spocContact", v)}
          placeholder="Phone or email"
          keyboardType="email-address"
          colors={colors}
        />

        {/* Submit */}
        <TouchableOpacity
          className="py-4 rounded-xl items-center mt-2"
          style={{ backgroundColor: loading ? colors.border : colors.accent }}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">
              Create Internship
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
