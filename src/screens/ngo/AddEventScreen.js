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
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Toast from "react-native-toast-message";
const api = require("../../../apis/api");
// --- DATE INPUT BOX COMPONENT ---
const DateInputBox = ({ label, dateValue, showPicker, setShowPicker, setDateValue, colors }) => {
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
          {React.createElement('input', {
            type: 'date',
            value: dateString,
            onChange: (e) => {
              const newDate = e.target.value ? new Date(e.target.value) : null;
              if (newDate) setDateValue(newDate);
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
            if (Platform.OS === 'android') setShowPicker(false);
            if (d) setDateValue(d);
          }}
        />
      )}
    </View>
  );
};

// --- TIME INPUT BOX COMPONENT ---
const TimeInputBox = ({ label, timeValue, showPicker, setShowPicker, setTimeValue, colors }) => {
  if (Platform.OS === 'web') {
    const timeString = timeValue ? timeValue.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

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
          {React.createElement('input', {
            type: 'time',
            value: timeString,
            onChange: (e) => {
              const [hours, minutes] = e.target.value.split(':');
              const newTime = new Date();
              newTime.setHours(parseInt(hours), parseInt(minutes));
              setTimeValue(newTime);
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

  const formattedTime = timeValue ? timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time';
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
        <Text style={{ color: timeValue ? colors.textPrimary : colors.textSecondary, fontSize: 16 }}>
          {formattedTime}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={timeValue || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, t) => {
            if (Platform.OS === 'android') setShowPicker(false);
            if (t) setTimeValue(t);
          }}
        />
      )}
    </View>
  );
};

export default function AddEventScreen() {
  const { goBack } = useContext(NavigationContext);
  const { accessToken } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [location, setLocation] = useState("");
  const [aim, setAim] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState("");
  const [spocName, setSpocName] = useState("");
  const [spocContact, setSpocContact] = useState("");
  // date & time fields
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const onStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowStartDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const onEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowEndDatePicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const onStartTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowStartTimePicker(false);
    if (selectedTime) setStartTime(selectedTime);
  };

  const onEndTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowEndTimePicker(false);
    if (selectedTime) setEndTime(selectedTime);
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


  const handleSubmit = async () => {
    try {
      const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      const reqBody = {
        location,
        aim,
        description,
        images,
        spocName,
        spocContact,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      };

      const response = await fetch(api.eventAllAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
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
          placeholder="SPOC / Event Manager Name"
          value={spocName}
          onChangeText={setSpocName}
          className="border rounded-lg p-3 mb-4 text-base"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          placeholder="SPOC Contact Number"
          value={spocContact}
          onChangeText={setSpocContact}
          keyboardType="phone-pad"
          className="border rounded-lg p-3 mb-4 text-base"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
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
        <View className="flex-row justify-between">
          <View style={{ width: '48%' }}>
            <DateInputBox
              label="Start Date"
              dateValue={startDate}
              showPicker={showStartDatePicker}
              setShowPicker={setShowStartDatePicker}
              setDateValue={setStartDate}
              colors={colors}
            />
          </View>
          <View style={{ width: '48%' }}>
            <DateInputBox
              label="End Date"
              dateValue={endDate}
              showPicker={showEndDatePicker}
              setShowPicker={setShowEndDatePicker}
              setDateValue={setEndDate}
              colors={colors}
            />
          </View>
        </View>

        <View className="flex-row justify-between">
          <View style={{ width: '48%' }}>
            <TimeInputBox
              label="Start Time"
              timeValue={startTime}
              showPicker={showStartTimePicker}
              setShowPicker={setShowStartTimePicker}
              setTimeValue={setStartTime}
              colors={colors}
            />
          </View>
          <View style={{ width: '48%' }}>
            <TimeInputBox
              label="End Time"
              timeValue={endTime}
              showPicker={showEndTimePicker}
              setShowPicker={setShowEndTimePicker}
              setTimeValue={setEndTime}
              colors={colors}
            />
          </View>
        </View>

        <TouchableOpacity
          className="p-4 rounded-lg items-center mt-2.5 mb-10"
          style={{ backgroundColor: colors.accent || "#f59e0b" }}
          onPress={handleSubmit}
        >
          <Text className="text-white text-lg font-bold">Add Event</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
