import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";

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
 const { logout } = useContext(AuthContext);

  useEffect(() => {
    fetchEvents();
  }, []);
  const handleLogout = async () => {
    // try {
    //   const response = await fetch(api.logoutAPI, {
    //     method: "POST",
    //     credentials: "include",
    //     headers: {
    //       Accept: "application/json",
    //       "Content-Type": "application/json",
    //     },
    //   });

    //   if (!response.ok) {
    //     throw new Error(`HTTP error! status: ${response.status}`);
    //   }

    //   console.log("Logged out successfully");
    // } catch (error) {
    //   console.error("Error logging out:", error);
    // }
     await logout();
    navigate("Home");

  };
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
  
// ...existing code...
  return (
    <View
      className="flex-1 p-5"
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) ||
          "#eef2ff",
      }}
    >
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl font-bold" style={{ color: colors.header }}>
          Events
        </Text>

        {loggedNgo ? (
          <View className="ml-auto flex-row items-center">
            <Text
              className="mr-2.5 font-bold"
              style={{ color: colors.textPrimary }}
            >
              {loggedNgo.name}
            </Text>
            <TouchableOpacity
              className="py-2 px-2.5 rounded-lg"
              style={{ backgroundColor: colors.accent }}
              onPress={() => {
                handleLogout();
              }}
            >
              <Text className="text-white font-bold text-sm">Logout</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Event List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator
            size="large"
            color={colors.accent}
          />
        </View>
      ) : events.length === 0 ? (
        <Text className="text-center mt-5 text-base" style={{ color: colors.textSecondary }}>
          No events found. Click the + button to add an event.
        </Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item, index) => item._id || index.toString()}
          className="w-full"
          renderItem={({ item }) => (
            <TouchableOpacity
              className="p-4 rounded-xl mb-3 border"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              }}
              onPress={() => {
                navigate("EventInfo", { event: item });
              }}
            >
              <Text className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
                {item.aim}
              </Text>
              <Text
                className="text-base mb-2"
                style={{ color: colors.textSecondary }}
              >
                📍 {item.location}
              </Text>
              <Text
                className="text-base mb-2 leading-5"
                style={{
                  color: colors.textSecondary,
                }}
              >
                {item.description && item.description.length > 100
                  ? `${item.description.substring(0, 100)}...`
                  : item.description}
              </Text>
              <Text className="text-base" style={{ color: colors.textSecondary }}>
                📅 {new Date(item.eventDate).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Event Button */}
      {loggedNgo && (
        <TouchableOpacity
          className="absolute right-5 bottom-6 px-4 py-3 rounded-full shadow-lg"
          style={{ backgroundColor: colors.accent }}
          onPress={() => navigate("AddEvent")}
        >
          <Text className="text-white font-bold">Add Event</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
