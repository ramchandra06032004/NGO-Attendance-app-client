import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  refreshing, onRefresh,
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

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
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

  return (
    <View
      className="flex-1 px-5 pt-8" // Increased top padding for safety
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) || "#eef2ff",
      }}
    >
      {/* --- NEW HEADER LAYOUT START --- */}
      {loggedNgo && (
        <View className="flex-row justify-between items-start mb-6">
          {/* LEFT SIDE: Logo Box + Name/Address */}
          <View className="flex-row items-center flex-1 mr-2">
            
            {/* 1. Logo Box */}
            <View
              className="rounded-lg mr-3 overflow-hidden border"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.cardBg,
                width: 50,
                height: 50,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loggedNgo.profileImage ? (
                <Image
                  source={{ uri: loggedNgo.profileImage }}
                  style={{ width: 50, height: 50 }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-lg font-bold" style={{ color: colors.accent }}>
                  {getInitials(loggedNgo.name)}
                </Text>
              )}
            </View>

            {/* 2. Name & Address Column */}
            <View className="flex-1">
              <Text
                className="text-lg font-bold leading-tight"
                style={{ color: colors.textPrimary }}
                numberOfLines={1}
              >
                {loggedNgo.name}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {loggedNgo.address || "No Address Provided"}
              </Text>
            </View>
          </View>

          {/* RIGHT SIDE: Logout Button */}
          <TouchableOpacity
            className="px-3 py-1.5 rounded-full border ml-1"
            style={{ borderColor: colors.error || "#ef4444", borderWidth: 1 }}
            onPress={handleLogout}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: colors.error || "#ef4444" }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* --- NEW HEADER LAYOUT END --- */}

      {/* 3. "Events" Title Below Everything */}
      <Text
        className="text-2xl font-extrabold mb-4"
        style={{ color: colors.header }}
      >
        Events
      </Text>

      {/* Event List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : events.length === 0 ? (
        <View className="flex-1 justify-center items-center opacity-60">
          <Text className="text-base" style={{ color: colors.textSecondary }}>
            No events found. 
          </Text>
          <Text className="text-base" style={{ color: colors.textSecondary }}>
            Click the + button to create your first event! 
          </Text>
          
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="p-4 rounded-2xl mb-4 border shadow-sm"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                elevation: 2,
              }}
              onPress={() => {
                navigate("EventInfo", { event: item });
              }}
              activeOpacity={0.8}
            >
              {/* Event Title */}
              <Text
                className="text-lg font-bold mb-1"
                style={{ color: colors.textPrimary }}
              >
                {item.aim}
              </Text>

              {/* Location */}
              <View className="flex-row items-center mb-2 opacity-90">
                <Text style={{ fontSize: 13, marginRight: 4 }}>📍</Text>
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  {item.location}
                </Text>
              </View>

              {/* Date Badge */}
              <View
                className="self-start px-2 py-1 rounded-md mb-2"
                style={{ backgroundColor: colors.iconBg }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  📅 {new Date(item.eventDate).toLocaleDateString()}
                </Text>
              </View>
              
               {/* Description Snippet */}
              <Text
                className="text-sm leading-5"
                numberOfLines={2}
                style={{ color: colors.textSecondary }}
              >
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Action Button (FAB) */}
      {loggedNgo && (
        <TouchableOpacity
          className="absolute right-6 bottom-8 px-5 py-4 rounded-full shadow-xl flex-row items-center"
          style={{
            backgroundColor: colors.accent,
            elevation: 6,
          }}
          onPress={() => navigate("AddEvent")}
        >
          <Text className="text-white text-xl font-bold mr-2">+</Text>
          <Text className="text-white font-bold text-base">New Event</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}