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
import { ChevronLeft, ClipboardList } from "lucide-react-native";

export default function SubmitWorkLogScreen({ internshipId, internshipTitle, startDate, endDate }) {
  const { goBack } = useContext(NavigationContext);
  const { accessToken } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [content, setContent] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
 
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  const hasStarted = today >= start;
  const isOver = today > end;
 
  // Set default date to today if it's within range, otherwise start date
  const [date, setDate] = useState(() => {
    if (today < start) return start;
    if (today > end) return end;
    return today;
  });

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("Missing Content", "Please write your work log for the day");
      return;
    }
    if (content.trim().length < 20) {
      Alert.alert("Too Short", "Please write a more detailed work log (at least 20 characters)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(api.studentSubmitWorkLogAPI(internshipId), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          date: date.toISOString(),
          content: content.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Submitted! ✅", "Your work log has been submitted successfully.", [
          { text: "OK", onPress: () => goBack() },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to submit work log");
      }
    } catch {
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
        style={{
          borderBottomColor: colors.border,
          backgroundColor: colors.cardBg,
        }}
      >
        <TouchableOpacity
          onPress={goBack}
          className="p-2 rounded-full mr-3 border"
          style={{ borderColor: colors.border }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text
            className="text-xl font-extrabold"
            style={{ color: colors.header }}
          >
            Post Work Log
          </Text>
          <Text
            className="text-xs"
            numberOfLines={1}
            style={{ color: colors.textSecondary }}
          >
            {internshipTitle || "Daily Update"}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info card */}
        <View
          className="p-3 rounded-xl mb-5 border flex-row items-center"
          style={{ backgroundColor: hasStarted ? `${colors.accent}10` : "#ef444410", borderColor: hasStarted ? `${colors.accent}30` : "#ef444430" }}
        >
          <ClipboardList size={18} color={hasStarted ? colors.accent : "#ef4444"} style={{ marginRight: 10 }} />
          <Text className="text-xs flex-1" style={{ color: colors.textSecondary }}>
            {!hasStarted 
              ? `Note: This internship starts on ${start.toLocaleDateString()}. You can only submit logs once it begins.`
              : isOver 
                ? "This internship has ended. You can still submit back-dated logs for the internship period."
                : "Share what you worked on today. Be specific about tasks completed, skills learned, or challenges faced."}
          </Text>
        </View>

        {/* Date picker */}
        <View className="mb-5">
          <Text
            className="text-xs font-bold mb-2"
            style={{ color: colors.textSecondary }}
          >
            DATE OF WORK
          </Text>
          {Platform.OS === "web" ? (
            <input
              type="date"
              value={date.toISOString().split("T")[0]}
              min={start.toISOString().split("T")[0]}
              max={(today < end ? today : end).toISOString().split("T")[0]}
              onChange={(e) => e.target.value && setDate(new Date(e.target.value))}
              style={{
                padding: "12px 16px",
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
              className="px-4 py-3.5 rounded-xl border flex-row justify-between items-center"
              style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: colors.textPrimary }}>
                📅 {date.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </Text>
              <Text style={{ color: colors.textSecondary }}>▼</Text>
            </TouchableOpacity>
          )}
          {Platform.OS !== "web" && showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={start}
              maximumDate={today < end ? today : end}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, d) => {
                setShowDatePicker(false);
                if (d) setDate(d);
              }}
            />
          )}
        </View>

        {/* Content textarea */}
        <View className="mb-6">
          <Text
            className="text-xs font-bold mb-2"
            style={{ color: colors.textSecondary }}
          >
            TODAY'S WORK LOG <Text style={{ color: "#ef4444" }}>*</Text>
          </Text>
          <TextInput
            className="px-4 py-4 rounded-xl border"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              color: colors.textPrimary,
              minHeight: 180,
              textAlignVertical: "top",
              lineHeight: 22,
              fontSize: 14,
            }}
            placeholder="Describe what you worked on today...&#10;&#10;e.g.&#10;• Tasks completed&#10;• Skills learned&#10;• Challenges faced&#10;• Goals for tomorrow"
            placeholderTextColor={colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
          />
          {/* Character count */}
          <Text
            className="text-[10px] text-right mt-1"
            style={{
              color: content.trim().length < 20 ? "#f59e0b" : colors.textSecondary,
            }}
          >
            {content.trim().length} characters {content.trim().length < 20 ? "(min 20)" : "✓"}
          </Text>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          className="py-4 rounded-xl items-center"
          style={{
            backgroundColor: (loading || !hasStarted) ? colors.border : colors.accent,
          }}
          onPress={handleSubmit}
          disabled={loading || !hasStarted}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">
              {!hasStarted ? "Internship Not Started" : "Submit Work Log ✓"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
