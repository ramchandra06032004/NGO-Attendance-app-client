import React, { useState, useContext, createElement } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ToastAndroid,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import Toast from "react-native-toast-message";
const api = require("../../../apis/api");

export default function AddEventScreen() {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [location, setLocation] = useState("");
  const [aim, setAim] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState("");
  // date & time fields
  const [eventDate, setEventDate] = useState(new Date());
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEventDatePicker(false);
    }
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleImageInputFocus = () => {
    const message = "Feature coming soon in next updates";
    if (Platform.OS === "web") {
      window.alert(message);
    } else if (Platform.OS === 'android') {
      Toast.show({
        type: "info",
        text1: "Coming Soon! ",
        text2: `Feature will be available soon in the further updates`,
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  // --- DATE INPUT BOX COMPONENT ---
  const DateInputBox = ({ label, dateValue, showPicker, setShowPicker }) => {
    // 1. WEB VERSION: Uses standard HTML <input type="date">
    if (Platform.OS === 'web') {
      const dateString = dateValue ? dateValue.toISOString().split('T')[0] : '';

      return (
        <View className="mb-4">
          <Text className="mb-2 text-base" style={{ color: colors.textPrimary }}>
            {label}
          </Text>
          <View style={{
            borderBottomWidth: 1,
            borderColor: colors.border,
            paddingVertical: 4,
            height: 40,
            justifyContent: 'center'
          }}>
            {createElement('input', {
              type: 'date',
              value: dateString,
              onChange: (e) => {
                const newDate = e.target.value ? new Date(e.target.value) : null;
                if (newDate) setEventDate(newDate);
              },
              style: {
                border: 'none',
                outline: 'none',
                backgroundColor: colors.iconBg,
                color: colors.textPrimary,
                fontSize: '16px',
                padding: '8px',
                fontFamily: 'System',
                width: '100%'
              }
            })}
          </View>
        </View>
      );
    }

    // 2. MOBILE VERSION: Uses TouchableOpacity + Native Modal
    const formattedDate = dateValue ? dateValue.toLocaleDateString() : 'Select Date';
    return (
      <View className="mb-4">
        <Text className="mb-2 text-base" style={{ color: colors.textPrimary }}>
          {label}
        </Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={{
            borderBottomWidth: 1,
            borderColor: colors.border,
            paddingVertical: 12,
            backgroundColor: colors.iconBg,
            paddingLeft: 12
          }}
        >
          <Text style={{ color: dateValue ? colors.textPrimary : colors.textSecondary, fontSize: 16 }}>
            {formattedDate}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={dateValue || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => {
              onDateChange(e, d);
            }}
          />
        )}
      </View>
    );
  };

  const handleSubmit = async () => {
    try {
      const reqBody = {
        location,
        aim,
        description,
        images,
        eventDate: eventDate.toISOString(),
      };

      const response = await fetch(api.eventAllAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Event added successfully:", data);
      goBack();
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Failed to add event: " + error.message);
    }
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.backgroundColors
          ? colors.backgroundColors[0]
          : "#fff",
      }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={goBack}
          style={{
            marginBottom: 15,
            alignSelf: 'flex-start',
          }}
        >
          <Text style={{ fontSize: 28, color: colors.textPrimary }}>←</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold mb-5 text-center" style={{ color: colors.header }}>
          Add New Event
        </Text>
        <TextInput
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
          className="border rounded-lg p-3 mb-4 text-base"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          placeholder="Aim"
          value={aim}
          onChangeText={setAim}
          className="border rounded-lg p-3 mb-4 text-base"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          className="border rounded-lg p-3 mb-4 text-base"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
            height: 100,
            textAlignVertical: "top",
          }}
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          placeholder="Images (URLs separated by commas)"
          value={images}
          onChangeText={setImages}
          onFocus={handleImageInputFocus}
          className="border rounded-lg p-3 mb-4 text-base"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
          placeholderTextColor={colors.textSecondary}
        />
        <View className="mb-4">
          <DateInputBox
            label="Event Date"
            dateValue={eventDate}
            showPicker={showEventDatePicker}
            setShowPicker={setShowEventDatePicker}
          />
        </View>
        <TouchableOpacity
          className="p-4 rounded-lg items-center mt-2.5"
          style={{ backgroundColor: colors.accent || "#f59e0b" }}
          onPress={handleSubmit}
        >
          <Text className="text-white text-lg font-bold">Add Event</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
