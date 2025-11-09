import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { AttendanceContext } from "../../context/AttendanceContext";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";

export default function StudentsListScreen({ eventId, college, route }) {
  const { events, markAttendance } = useContext(AttendanceContext);
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All Classes");

  // Fetch students and classes when component mounts
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        // Get the college data which includes classes
        const collegeRes = await fetch(api.getAllCollegeAPI, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!collegeRes.ok) throw new Error("Failed to fetch college data");
        const collegeData = await collegeRes.json();

        // Find the current college and extract its classes
        const currentCollege = collegeData?.statusCode?.find(
          (c) => c.name === college
        );
        const classList = currentCollege?.classes || [];

        if (mounted) {
          setClasses(["All Classes", ...classList]);
          setSelectedClass("All Classes");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        if (mounted) setError(err.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [college]);

  // Filter students based on selected class
  const filteredStudents =
    selectedClass === "All Classes"
      ? students
      : students.filter((s) => s.class === selectedClass);

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
          Students — {college}
        </Text>

        {/* Class Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {classes.map((className) => (
            <TouchableOpacity
              key={className}
              style={[
                styles.filterBtn,
                { borderColor: colors.border },
                selectedClass === className && {
                  backgroundColor: colors.accent,
                  borderColor: colors.accent,
                },
              ]}
              onPress={() => setSelectedClass(className)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: colors.textPrimary },
                  selectedClass === className && { color: "#fff" },
                ]}
              >
                {className}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.accent}
              style={styles.loader}
            />
          ) : error ? (
            <Text style={[styles.error, { color: colors.textSecondary }]}>
              {error}
            </Text>
          ) : filteredStudents.length === 0 ? (
            <Text style={[styles.error, { color: colors.textSecondary }]}>
              No students found
            </Text>
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(s) => s.id || s._id}
              renderItem={({ item }) => (
                <View style={[styles.row, { borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: colors.textSecondary }}>
                      {item.class}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      style={[
                        styles.markBtn,
                        item.status === "present" && styles.activePresent,
                      ]}
                      onPress={() =>
                        markAttendance(event.id, item.id, "present")
                      }
                    >
                      <Text style={{ color: colors.textPrimary }}>Present</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.markBtn,
                        item.status === "absent" && styles.activeAbsent,
                      ]}
                      onPress={() =>
                        markAttendance(event.id, item.id, "absent")
                      }
                    >
                      <Text style={{ color: colors.textPrimary }}>Absent</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

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
    maxWidth: 640,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  filterContainer: {
    flexGrow: 0,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontWeight: "600",
  },
  list: {
    flex: 1,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  markBtn: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: "transparent",
  },
  activePresent: {
    backgroundColor: "#bbf7d0",
  },
  activeAbsent: {
    backgroundColor: "#fecaca",
  },
  loader: {
    marginTop: 20,
  },
  error: {
    textAlign: "center",
    marginTop: 20,
  },
  link: {
    marginTop: 12,
  },
});
