import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
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
        <Text style={[styles.title, { color: colors.header }]}>
          Select College
        </Text>
        <ScrollView
          style={[
            styles.picker,
            { backgroundColor: colors.iconBg, borderColor: colors.border },
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={{ margin: 12 }}
            />
          ) : error ? (
            <Text style={{ color: colors.textSecondary, padding: 12 }}>
              {error}
            </Text>
          ) : colleges.length === 0 ? (
            <Text style={{ color: colors.textSecondary, padding: 12 }}>
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
                  style={[
                    styles.item,
                    getCollegeName(selectedCollege) === name && {
                      backgroundColor: darkMode ? "#ffffff12" : "#fef3c7",
                    },
                  ]}
                >
                  <Text style={{ color: colors.textPrimary }}>{name}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={{ color: colors.textSecondary, padding: 12 }}>
              Error: Invalid college data format
            </Text>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.action, { backgroundColor: colors.accent }]}
          onPress={() =>
            navigate("StudentsList", {
              college: selectedCollege, // pass whole object
              eventId: eventId
            })
          }
          disabled={!selectedCollege}
        >
          <Text style={styles.actionText}>Get Students list</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
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
  title: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  picker: { maxHeight: 240, marginBottom: 12, borderRadius: 8 },
  item: { padding: 12, borderRadius: 8 },
  action: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "700" },
  link: { marginTop: 12 },
});