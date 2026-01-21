import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { AttendanceContext } from "../../context/AttendanceContext";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";

export default function SelectCollegeScreen({ eventId }) {
  const { getColleges } = useContext(AttendanceContext);
  const { navigate, goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null); // store entire object
  const [loading, setLoading] = useState(colleges.length === 0);
  const [error, setError] = useState("");

  useEffect(() => {
    // fetch colleges from API if we don't already have them
    let mounted = true;
    async function fetchColleges() {
      if (colleges && colleges.length) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(api.getAllCollegeAPI, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to load colleges: " + res.status);
        const data = await res.json();
        console.log("API Response:", data);
        // colleges array is in data.statusCode or data.data.colleges
        const list = data?.data?.colleges || data?.statusCode || [];
        if (!Array.isArray(list)) {
          console.error("Invalid colleges data:", list);
          throw new Error("Invalid response format");
        }
        console.log("Processed college list:", list);
        if (!mounted) return;
        setColleges(list);
        // set the whole object as selected (not just name)
        setSelectedCollege((prev) => prev || (list[0] ? list[0] : null));
      } catch (err) {
        console.error("Error fetching colleges", err);
        if (mounted) setError(err.message || "Error fetching colleges");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchColleges();
    return () => (mounted = false);
  }, []);

  function getCollegeName(c) {
    if (!c) return "";
    if (typeof c === "string") return c;
    return c.name || c.collegeName || c.title || c._id || "";
  }

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
        <Text className="text-2xl font-bold mb-2.5" style={{ color: colors.header }}>
          Select College
        </Text>
        <ScrollView
          className="rounded-lg mb-3 border max-h-60"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
          }}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              className="my-3"
            />
          ) : error ? (
            <Text className="text-sm p-3" style={{ color: colors.textSecondary }}>
              {error}
            </Text>
          ) : colleges.length === 0 ? (
            <Text className="text-sm p-3" style={{ color: colors.textSecondary }}>
              No colleges found.
            </Text>
          ) : Array.isArray(colleges) ? (
            colleges.map((c) => {
              const name = getCollegeName(c);
              const key =
                (typeof c === "string" ? c : c._id || name) ||
                Math.random().toString(36).slice(2, 9);
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedCollege(c)}
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor:
                      getCollegeName(selectedCollege) === name
                        ? darkMode
                          ? "#ffffff12"
                          : "#fef3c7"
                        : "transparent",
                  }}
                >
                  <Text style={{ color: colors.textPrimary }}>{name}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text className="text-sm p-3" style={{ color: colors.textSecondary }}>
              Error: Invalid college data format
            </Text>
          )}
        </ScrollView>

        <TouchableOpacity
          className="mt-3 p-3 rounded-lg items-center"
          style={{ backgroundColor: colors.accent }}
          onPress={() =>
            navigate("StudentsList", {
              college: selectedCollege, // pass whole object
              eventId: eventId
            })
          }
          disabled={!selectedCollege}
        >
          <Text className="text-white font-bold">Get Students list</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-3" onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}