import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
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

  useEffect(() => {
    // Normalize incoming college -> classes (handles className / name)
    console.log("StudentsListScreen college prop:", college);
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
    setPresentIds(new Set());
  }, [college]);

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

  const handleSubmit = async () => {
    const presentArray = Array.from(presentIds);
    const collegeId = college?._id || college?.id;
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
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log("Attendance submitted successfully:", data);

      // Show success alert
      Alert.alert("Success", "Attendance has been submitted successfully!", [
        { text: "OK" },
      ]);
    } catch (err) {
      console.log("Error in submitting attendance:", err);
      Alert.alert("Error", "Failed to submit attendance: " + err.message, [
        { text: "OK" },
      ]);
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

      return (
        <View
          key={id}
          className="flex-row items-center py-3 border-b"
          style={{
            borderColor: colors.border,
          }}
        >
          <View className="flex-1">
            <Text style={{ color: colors.textPrimary }}>{name}</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>PRN: {prn}</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>Dept: {dept}</Text>
          </View>

          <View className="flex-row">
            <TouchableOpacity
              onPress={() => togglePresent(id)}
              className="px-3 py-2 rounded-lg border mr-2"
              style={{
                borderColor: colors.border,
                backgroundColor: isPresent ? "#bbf7d0" : "transparent",
              }}
            >
              <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                Present
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => markAbsent(id)}
              className="px-3 py-2 rounded-lg border"
              style={{
                borderColor: colors.border,
                backgroundColor: !isPresent ? "#fecaca" : "transparent",
              }}
            >
              <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                Absent
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    });
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
        className="w-full max-w-2xl p-4.5 rounded-xl border flex-1"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        }}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
          <Text className="text-lg font-bold mb-2" style={{ color: colors.header }}>
            Students — {college?.name || college?.collegeName || "College"}
          </Text>

          {/* Vertical dropdown filter for classes */}
          <View className="mb-3">
            <TouchableOpacity
              onPress={() => setShowDropdown((s) => !s)}
              className="px-4 py-2.5 rounded-lg border"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.iconBg,
              }}
            >
              <Text className="font-semibold" style={{ color: colors.textPrimary }}>
                {selectedClass}
              </Text>
            </TouchableOpacity>

            {showDropdown && (
              <View
                className="mt-2 rounded-lg border overflow-hidden"
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
                        borderColor:
                          selectedClass === className ? colors.accent : colors.border,
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
              <Text className="text-center mt-5 text-sm" style={{ color: colors.textSecondary }}>
                No classes / students found
              </Text>
            ) : selectedClass === "All Classes" ? (
              classObjects.map((cls) => (
                <View key={cls._id} className="mb-3">
                  <Text className="text-base font-bold mb-1.5" style={{ color: colors.header }}>
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
                      className="text-base font-bold mb-1.5"
                      style={{ color: colors.header }}
                    >
                      {selectedClass}
                    </Text>
                    {renderStudentsForClass(cls)}
                  </View>
                ) : (
                  <Text className="text-center mt-5 text-sm" style={{ color: colors.textSecondary }}>
                    No students found for {selectedClass}
                  </Text>
                );
              })()
            )}
          </View>

          <View className="mt-3">
            <TouchableOpacity
              onPress={handleSubmit}
              className="p-3 rounded-lg items-center"
              style={{
                backgroundColor: colors.accent,
              }}
            >
              <Text className="text-white font-bold">Submit Attendance</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="mt-3" onPress={() => goBack()}>
            <Text style={{ color: colors.textPrimary }}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}
