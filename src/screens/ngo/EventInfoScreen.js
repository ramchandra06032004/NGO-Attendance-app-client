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
      date: "",
      students: [],
      _id: "",
    };

  const title = event.aim || event.name || event.title || "";
  const rawDate = event.eventDate || event.date || "";
  const formattedDate = rawDate ? new Date(rawDate).toLocaleString() : "N/A";

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
        <Text className="text-2xl font-bold mb-2" style={{ color: colors.header }}>{title}</Text>
        <Text className="mb-2 text-base" style={{ color: colors.textPrimary }}>
          Location: {event.location || "N/A"}
        </Text>
        <Text className="mb-2 text-base" style={{ color: colors.textPrimary }}>
          Date: {formattedDate}
        </Text>
        <Text className="mb-2.5 text-base" style={{ color: colors.textSecondary }}>
          About Event: {event.description}
        </Text>
        {event.students && (
          <Text className="mb-4 text-base" style={{ color: colors.textPrimary }}>
            {event.students.length} students registered
          </Text>
        )}

        <TouchableOpacity
          className="mt-4 p-3 rounded-lg items-center"
          style={{ backgroundColor: colors.accent }}
          onPress={() =>
            navigate("SelectCollege", { eventId: event._id || event.id })
          }
        >
          <Text className="text-white font-bold">Mark Attendance</Text>
        </TouchableOpacity>

        {/* New button: View marked attendance records */}
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
