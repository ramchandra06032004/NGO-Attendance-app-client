import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { AttendanceContext } from "../../context/AttendanceContext";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";

export default function NgoEventsScreen({ ngo: loggedNgo }) {
  const { navigate, goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(api.eventAllAPI, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched events:", data);
      setEvents(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            (colors.backgroundColors && colors.backgroundColors[0]) ||
            styles.container.backgroundColor,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.header }]}>Events</Text>

        {loggedNgo ? (
          <View
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                marginRight: 10,
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              {loggedNgo.name}
            </Text>
            <TouchableOpacity
              style={[styles.logoutBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigate("Home")}
            >
              <Text style={{ color: "#fff" }}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Event List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.accent}
          style={styles.loader}
        />
      ) : events.length === 0 ? (
        <Text style={[styles.noEvents, { color: colors.textSecondary }]}>
          No events found. Click the + button to add an event.
        </Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item, index) => item._id || index.toString()}
          style={{ width: "100%" }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.eventCard,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
              ]}
              onPress={() => {
                navigate("EventInfo", { event: item });
              }}
            >
              <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                {item.aim}
              </Text>
              <Text
                style={[styles.eventLocation, { color: colors.textSecondary }]}
              >
                📍 {item.location}
              </Text>
              <Text
                style={[
                  styles.eventDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {item.description && item.description.length > 100
                  ? `${item.description.substring(0, 100)}...`
                  : item.description}
              </Text>
              <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                📅 {new Date(item.eventDate).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Event Button */}
      {loggedNgo && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent }]}
          onPress={() => navigate("AddEvent")}
        >
          <Text style={styles.fabText}>Add Event</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#eef2ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    paddingRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  eventCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 14,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  eventDate: {
    fontSize: 14,
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noEvents: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#0ea5a4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 4,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
});
