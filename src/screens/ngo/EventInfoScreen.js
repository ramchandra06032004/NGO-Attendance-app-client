import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";

export default function EventInfoScreen({ route }) {
  const { goBack, navigate } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  // Support both shapes: { event } or { item } passed in route.params
  const params = (route && route.params) || {};
  const event = params.event ||
    params.item || {
    aim: "",
    name: "",
    location: "",
    description: "",
    eventDate: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    spocName: "",
    spocContact: "",
    date: "",
    students: [],
    _id: "",
  };

  const title = event.aim || event.name || event.title || "";
  const startDate = event.startDate || event.eventDate || event.date || "";
  const endDate = event.endDate || startDate;
  
  const dateRangeStr = startDate ? 
    (new Date(startDate).toLocaleDateString() + (endDate && endDate !== startDate ? ` - ${new Date(endDate).toLocaleDateString()}` : "")) 
    : "N/A";

  const timeRangeStr = (event.startTime && event.endTime) ? `${event.startTime} - ${event.endTime}` : "N/A";

  const handleCallSPOC = () => {
    if (event.spocContact) {
      require('react-native').Linking.openURL(`tel:${event.spocContact}`);
    }
  };

  return (
    <View
      className="flex-1 p-5 justify-center items-center"
      style={{
        backgroundColor: colors.backgroundColors
          ? colors.backgroundColors[0]
          : "#fff",
      }}
    >
      <View
        className="w-full max-w-md p-5 rounded-xl border"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        }}
      >
        <Text className="text-2xl font-bold mb-3" style={{ color: colors.header }}>{title}</Text>
        
        <View className="mb-4">
          <Text className="mb-1 text-sm font-bold" style={{ color: colors.accent }}>📍 Location</Text>
          <Text className="text-base" style={{ color: colors.textPrimary }}>{event.location || "N/A"}</Text>
        </View>

        <View className="mb-4">
          <Text className="mb-1 text-sm font-bold" style={{ color: colors.accent }}>📅 Date Range</Text>
          <Text className="text-base" style={{ color: colors.textPrimary }}>{dateRangeStr}</Text>
        </View>

        <View className="mb-4">
          <Text className="mb-1 text-sm font-bold" style={{ color: colors.accent }}>⏰ Daily Timing</Text>
          <Text className="text-base" style={{ color: colors.textPrimary }}>{timeRangeStr}</Text>
        </View>

        {event.spocName && (
          <View className="mb-4">
            <Text className="mb-1 text-sm font-bold" style={{ color: colors.accent }}>👤 Event Manager (SPOC)</Text>
            <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>{event.spocName}</Text>
            {event.spocContact && (
              <TouchableOpacity onPress={handleCallSPOC} className="mt-1 flex-row items-center">
                <Text style={{ fontSize: 13, marginRight: 4 }}>📞</Text>
                <Text className="text-sm font-medium" style={{ color: colors.accent }}>{event.spocContact}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="mb-4">
          <Text className="mb-1 text-sm font-bold" style={{ color: colors.accent }}>📝 About Event</Text>
          <Text className="text-base leading-5" style={{ color: colors.textSecondary }}>{event.description}</Text>
        </View>
        {event.students && (
          <Text className="mb-4 text-base" style={{ color: colors.textPrimary }}>
            {event.students.length} students registered
          </Text>
        )}

        <TouchableOpacity
          className="mt-4 p-3 rounded-lg items-center"
          style={{ backgroundColor: colors.accent }}
          onPress={() =>
            navigate("RegisteredStudents", {
              eventId: event._id || event.id,
              eventName: event.aim || event.name
            })
          }
        >
          <Text className="text-white font-bold">Mark Attendance</Text>
        </TouchableOpacity>

        {/* View marked attendance records */}
        <TouchableOpacity
          className="mt-3 p-3 rounded-lg items-center border"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.cardBg,
          }}
          onPress={() => {
            console.log("Event BEFORE Navigation:", event),
              navigate("AttendanceRecords", { event: event });
          }}
        >
          <Text className="font-bold" style={{ color: colors.textPrimary }}>
            View Attendance Records
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-3 items-center" onPress={() => goBack()}>
          <Text style={[{ color: colors.textPrimary }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
