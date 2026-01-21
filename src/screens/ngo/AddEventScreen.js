import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
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

  const onDateChange = (date) => {
    setEventDate(new Date(date));
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
          className="border rounded-lg p-3 mb-4 text-base"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
          placeholderTextColor={colors.textSecondary}
        />
        <View className="mb-4">
          <Text className="mb-2 text-base" style={{ color: colors.textPrimary }}>
            Select Date:
          </Text>
          <input
            type="date"
            value={eventDate.toISOString().split("T")[0]}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              backgroundColor: colors.iconBg,
              borderColor: colors.border,
              color: colors.textPrimary,
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 16,
              width: "100%",
            }}
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
