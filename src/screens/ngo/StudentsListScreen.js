import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";

export default function StudentsListScreen({ college, eventId: propEventId }) {
  //added line for testing git commit
  // eventId is passed as prop (not using react-navigation)
  const eventId = propEventId;

  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [classObjects, setClassObjects] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // store present student IDs in a Set
  const [presentIds, setPresentIds] = useState(new Set());
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  // Track students who were originally present (from database) - these will be locked
  const [originallyPresentIds, setOriginallyPresentIds] = useState(new Set());

  useEffect(() => {
    // Normalize incoming college -> classes (handles className / name)
    const collegeId = college?._id || college?.id;
    const collegeName = college?.name || college?.collegeName;

    console.log("=== STUDENTS LIST SCREEN EFFECT TRIGGERED ===");
    console.log("College ID:", collegeId);
    console.log("College Name:", collegeName);
    console.log("Event ID:", eventId);
    console.log("Resetting presentIds and originallyPresentIds...");
    console.log("============================================");

    const clsArray = Array.isArray(college?.classes) ? college.classes : [];
    const normalized = clsArray
      .map((c) => {
        if (!c) return null;
        const students = Array.isArray(c.students) ? c.students : [];
        return {
          _id: c._id || c.id || Math.random().toString(),
          name: c.className || c.name || `Class ${c._id || ""}`,
          students,
        };
      })
      .filter(Boolean);

    setClassObjects(normalized);
    setClasses(["All Classes", ...normalized.map((c) => c.name)]);
    setSelectedClass("All Classes");

    // Reset presentIds and originallyPresentIds immediately when college changes
    setPresentIds(new Set());
    setOriginallyPresentIds(new Set());

    // Fetch existing attendance when component mounts
    if (eventId) {
      fetchExistingAttendance();
    } else {
      setLoadingAttendance(false);
    }
  }, [college?._id || college?.id, eventId]); // Use college ID instead of entire object

  const togglePresent = (studentId) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const markAbsent = (studentId) => {
    // explicitly remove from present set
    setPresentIds((prev) => {
      if (!prev.has(studentId)) return prev;
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  // Fetch existing attendance for this event
  const fetchExistingAttendance = async () => {
    try {
      setLoadingAttendance(true);

      // Build a Set of all valid student IDs from the current college
      const validStudentIds = new Set();
      const clsArray = Array.isArray(college?.classes) ? college.classes : [];
      clsArray.forEach((cls) => {
        const students = Array.isArray(cls.students) ? cls.students : [];
        students.forEach((student) => {
          const id = student._id || student.id || student.prn;
          if (id) validStudentIds.add(id);
        });
      });

      console.log("Valid student IDs for this college:", Array.from(validStudentIds));

      const response = await fetch(
        `${api.ngo_host}/event/${eventId}/attendance`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Extract student IDs from attendance data
        const allAttendedStudentIds = data?.data?.attendance?.map(
          (record) => record._id || record.id
        ) || [];

        // Filter to only include students from the current college
        const filteredStudentIds = allAttendedStudentIds.filter(id => validStudentIds.has(id));

        console.log("All attendance loaded:", allAttendedStudentIds);
        console.log("Filtered to current college:", filteredStudentIds);

        setPresentIds(new Set(filteredStudentIds));
        setOriginallyPresentIds(new Set(filteredStudentIds)); // Lock these students
      } else {
        console.log("No existing attendance found or error fetching");
        setPresentIds(new Set());
        setOriginallyPresentIds(new Set());
      }
    } catch (err) {
      console.log("Error fetching existing attendance:", err);
      setPresentIds(new Set());
      setOriginallyPresentIds(new Set());
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSubmit = () => {
    // Platform-specific confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        "Are you sure you want to submit this attendance? This action is irreversible and cannot be undone."
      );
      if (confirmed) {
        submitAttendance();
      }
    } else {
      // Show confirmation alert before submitting (Mobile)
      Alert.alert(
        "Confirm Submission",
        "Are you sure you want to submit this attendance? This action is irreversible and cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Submit",
            onPress: () => submitAttendance(),
            style: "destructive"
          }
        ]
      );
    }
  };

  const submitAttendance = async () => {
    const presentArray = Array.from(presentIds);
    const collegeId = college?._id || college?.id;
    const collegeName = college?.name || college?.collegeName;

    console.log("=== SUBMIT ATTENDANCE DEBUG ===");
    console.log("College ID:", collegeId);
    console.log("College Name:", collegeName);
    console.log("Present IDs:", presentArray);
    console.log("Present IDs count:", presentArray.length);
    console.log("===============================");

    const reqBody = {
      studentIds: presentArray,
      eventId: eventId,
      collegeId: collegeId,
    };
    console.log(reqBody);

    try {
      const response = await fetch(api.attendanceAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.message) errMsg = errData.message;
        } catch { }
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log("Attendance submitted successfully:", data);

      // Show success alert and navigate back (Platform-specific)
      if (Platform.OS === 'web') {
        window.alert("Attendance has been submitted successfully!");
        goBack();
      } else {
        Alert.alert("Success", "Attendance has been submitted successfully!", [
          {
            text: "OK",
            onPress: () => goBack()
          },
        ]);
      }
    } catch (err) {
      console.log("Error in submitting attendance:", err);

      // Platform-specific error alert
      if (Platform.OS === 'web') {
        window.alert("Failed to submit attendance: " + err.message);
      } else {
        Alert.alert("Error", "Failed to submit attendance: " + err.message, [
          { text: "OK" },
        ]);
      }
    }
  };

  const renderStudentsForClass = (cls) => {
    const students = Array.isArray(cls.students) ? cls.students : [];
    if (students.length === 0) {
      return (
        <Text className="py-2 text-sm" style={{ color: colors.textSecondary }}>
          No students in this class
        </Text>
      );
    }

    return students.map((student) => {
      const id =
        student._id || student.id || student.prn || Math.random().toString();
      const prn =
        student.prn || student.PRN || student.roll || student.regNo || "—";
      const dept = student.department || student.dept || "—";
      const name = student.name || student.fullName || "Unknown";
      const isPresent = presentIds.has(id);
      const isLocked = originallyPresentIds.has(id); // Check if student was originally present

      return (
        <View
          key={id}
          className="p-4 rounded-xl mb-3 border"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-base font-bold mb-1" style={{ color: colors.header }}>{name}</Text>
              <View className="flex-row gap-3">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>PRN: {prn}</Text>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>Dept: {dept}</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => togglePresent(id)}
                disabled={isLocked}
                className="px-4 py-2 rounded-xl border"
                style={{
                  borderColor: isPresent ? colors.accent : colors.border,
                  backgroundColor: isPresent ? colors.accent : colors.cardBg,
                  opacity: isLocked ? 0.6 : 1,
                }}
              >
                <Text className="font-bold text-xs" style={{ color: isPresent ? '#fff' : colors.textPrimary }}>
                  {isLocked ? 'Marked' : 'Present'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => markAbsent(id)}
                disabled={isLocked}
                className="px-4 py-2 rounded-xl border"
                style={{
                  borderColor: !isPresent ? colors.error || '#ef4444' : colors.border,
                  backgroundColor: !isPresent ? colors.error || '#ef4444' : colors.cardBg,
                  opacity: isLocked ? 0.6 : 1,
                }}
              >
                <Text className="font-bold text-xs" style={{ color: !isPresent ? '#fff' : colors.textPrimary }}>
                  Absent
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    });
  };

  // Calculate present count
  const presentCount = presentIds.size;

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.backgroundColors
          ? colors.backgroundColors[0]
          : "#fff",
      }}
    >
      {/* Header Section */}
      <View className="px-5 pt-8 pb-4" style={{ backgroundColor: colors.cardBg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => goBack()}
            className="px-4 py-2 rounded-xl border flex-row items-center"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.backgroundColors?.[0] || '#fff',
            }}
          >
            <Text className="font-semibold" style={{ color: colors.textPrimary }}>← Back</Text>
          </TouchableOpacity>

          {/* Stats Badge */}
          <View className="px-4 py-2 rounded-xl" style={{ backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '30' }}>
            <Text className="font-bold text-sm" style={{ color: colors.accent }}>
              {presentCount} Present
            </Text>
          </View>
        </View>

        <Text className="text-2xl font-extrabold mb-1" style={{ color: colors.header }}>
          {college?.name.toUpperCase() || college?.collegeName.toUpperCase() || "College"}
        </Text>
        <Text className="text-sm" style={{ color: colors.textSecondary }}>
          Mark Attendance
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-5 pt-4">
        {loadingAttendance ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-3" style={{ color: colors.textSecondary }}>Loading attendance...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>

            {/* Class Filter Dropdown */}
            <View className="mb-4">
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>FILTER BY CLASS</Text>
              <TouchableOpacity
                onPress={() => setShowDropdown((s) => !s)}
                className="px-4 py-3 rounded-xl border flex-row items-center justify-between"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.cardBg,
                }}
              >
                <Text className="font-semibold" style={{ color: colors.textPrimary }}>
                  {selectedClass}
                </Text>
                <Text style={{ color: colors.textSecondary }}>{showDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showDropdown && (
                <View
                  className="mt-2 rounded-xl border overflow-hidden"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.cardBg,
                  }}
                >
                  <ScrollView
                    className="max-h-55"
                    showsVerticalScrollIndicator={true}
                  >
                    {classes.map((className) => (
                      <TouchableOpacity
                        key={className}
                        onPress={() => {
                          setSelectedClass(className);
                          setShowDropdown(false);
                        }}
                        className="px-4 py-3 border-b"
                        style={{
                          backgroundColor:
                            selectedClass === className ? colors.accent : "transparent",
                          borderColor: colors.border,
                        }}
                      >
                        <Text
                          className="font-semibold"
                          style={{
                            color:
                              selectedClass === className ? "#fff" : colors.textPrimary,
                          }}
                        >
                          {className}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View className="w-full">
              {classObjects.length === 0 ? (
                <View className="flex-1 justify-center items-center py-10">
                  <Text className="text-lg font-semibold mb-2" style={{ color: colors.textSecondary }}>No Students</Text>
                  <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                    No classes or students found
                  </Text>
                </View>
              ) : selectedClass === "All Classes" ? (
                classObjects.map((cls) => (
                  <View key={cls._id} className="mb-4">
                    <Text className="text-sm font-bold mb-3 uppercase" style={{ color: colors.textSecondary }}>
                      {cls.name}
                    </Text>
                    {renderStudentsForClass(cls)}
                  </View>
                ))
              ) : (
                (() => {
                  const cls = classObjects.find((c) => c.name === selectedClass);
                  return cls ? (
                    <View>
                      <Text
                        className="text-sm font-bold mb-3 uppercase"
                        style={{ color: colors.textSecondary }}
                      >
                        {selectedClass}
                      </Text>
                      {renderStudentsForClass(cls)}
                    </View>
                  ) : (
                    <View className="flex-1 justify-center items-center py-10">
                      <Text className="text-lg font-semibold mb-2" style={{ color: colors.textSecondary }}>No Students</Text>
                      <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                        No students found for {selectedClass}
                      </Text>
                    </View>
                  );
                })()
              )}
            </View>

            {/* Submit Button */}
            <View className="mt-6 mb-4">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={presentCount === 0}
                className="p-4 rounded-xl items-center"
                style={{
                  backgroundColor: presentCount === 0 ? colors.border : colors.accent,
                  opacity: presentCount === 0 ? 0.5 : 1,
                }}
              >
                <Text className="text-white font-bold text-base">
                  Submit Attendance {presentCount > 0 ? `(${presentCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
