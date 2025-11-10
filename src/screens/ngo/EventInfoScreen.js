import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColors
            ? colors.backgroundColors[0]
            : "#fff",
        },
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.header }]}>{title}</Text>
        <Text style={[styles.info, { color: colors.textPrimary }]}>
          Location: {event.location || "N/A"}
        </Text>
        <Text style={[styles.info, { color: colors.textPrimary }]}>
          Date: {formattedDate}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          About Event: {event.description}
        </Text>
        {event.students && (
          <Text style={[styles.info, { color: colors.textPrimary }]}>
            {event.students.length} students registered
          </Text>
        )}

        <TouchableOpacity
          style={[styles.action, { backgroundColor: colors.accent }]}
          onPress={() =>
            navigate("SelectCollege", { eventId: event._id || event.id })
          }
        >
          <Text style={styles.actionText}>Mark Attendance</Text>
        </TouchableOpacity>

        {/* New button: View marked attendance records */}
        <TouchableOpacity
          style={[
            styles.actionSecondary,
            {
              borderColor: colors.border,
              backgroundColor: colors.cardBg,
            },
          ]}
          // onPress={() =>
          //   { console.log(event),
          //     navigate("AttendanceRecords", {  event  })
          //   }
          // }
          onPress={() =>
  { 
    console.log("Event BEFORE Navigation:", event), // <--- CHECK THIS OUTPUT!
    navigate("AttendanceRecords", { event: event })
  }
}
        >
          <Text style={[styles.actionTextSecondary, { color: colors.textPrimary }]}>
            View Attendance Records
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => goBack()}>
          <Text style={[{ color: colors.textPrimary }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  desc: { marginBottom: 10 },
  info: { marginBottom: 8 },
  action: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "700" },
  link: { marginTop: 12, alignItems: "center" },

  /* Secondary action (view records) */
  actionSecondary: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  actionTextSecondary: {
    fontWeight: "700",
  },
});
