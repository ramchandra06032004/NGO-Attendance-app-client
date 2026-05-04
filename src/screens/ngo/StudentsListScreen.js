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
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";
import { ChevronLeft } from "lucide-react-native";

// ── Date helpers ─────────────────────────────────────────────────────────────
/** Returns "YYYY-MM-DD" for a Date or ISO string */
function toDateString(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns a user-friendly label like "Mon, Apr 14" */
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00"); // force local time
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Generates all dates from startDate to endDate (inclusive) as "YYYY-MM-DD" strings */
function getEventDates(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate || startDate);
  end.setHours(0, 0, 0, 0);
  const dates = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(toDateString(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Returns today as "YYYY-MM-DD" */
function todayString() {
  return toDateString(new Date());
}
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentsListScreen({ college, eventId: propEventId, route, event: propEvent, registeredStudents: propRegisteredStudents }) {
  const eventId = propEventId;

  // Get registered students from props or route params
  const registeredStudents = propRegisteredStudents || route?.params?.registeredStudents;
  const isFromRegisteredStudents = !!registeredStudents;

  // Event may be passed as prop or via route params
  const eventData = propEvent || route?.params?.event;

  const { goBack } = useContext(NavigationContext);
  const { accessToken } = useContext(AuthContext);
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

  // ── Multi-day date selection ─────────────────────────────────────────────
  const [eventDates, setEventDates] = useState([]); // all days in the event
  const [selectedDate, setSelectedDate] = useState(null); // currently selected day
  const isMultiDay = eventDates.length > 1;
  // ────────────────────────────────────────────────────────────────────────

  // Compute event dates whenever eventData or eventId changes
  useEffect(() => {
    const start = eventData?.startDate || eventData?.eventDate;
    const end = eventData?.endDate || start;
    if (start) {
      const dates = getEventDates(start, end);
      setEventDates(dates);
      // Default: today if within range, else first day
      const today = todayString();
      const defaultDate = dates.includes(today) ? today : dates[0];
      setSelectedDate(defaultDate);
    }
  }, [eventData]);

  useEffect(() => {
    // If coming from RegisteredStudentsScreen, use the provided students
    if (isFromRegisteredStudents) {
      const studentsByClass = {};
      registeredStudents.forEach((student) => {
        const className = student.class?.name || "Unassigned";
        const classId = student.class?._id || "unassigned";
        if (!studentsByClass[classId]) {
          studentsByClass[classId] = { _id: classId, name: className, students: [] };
        }
        studentsByClass[classId].students.push(student);
      });

      const normalized = Object.values(studentsByClass);
      setClassObjects(normalized);
      setClasses(["All Classes", ...normalized.map((c) => c.name)]);
      setSelectedClass("All Classes");
      setPresentIds(new Set());
      setOriginallyPresentIds(new Set());

      if (eventId && selectedDate) {
        fetchExistingAttendance(selectedDate);
      } else {
        setLoadingAttendance(false);
      }
      return;
    }

    // Original logic for normal attendance marking flow
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
    setOriginallyPresentIds(new Set());

    if (eventId && selectedDate) {
      fetchExistingAttendance(selectedDate);
    } else {
      setLoadingAttendance(false);
    }
  }, [college?._id || college?.id, eventId, isFromRegisteredStudents, selectedDate]);

  const togglePresent = (studentId) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const markAbsent = (studentId) => {
    setPresentIds((prev) => {
      if (!prev.has(studentId)) return prev;
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  // Fetch existing attendance for this event on the given date
  const fetchExistingAttendance = async (date) => {
    try {
      setLoadingAttendance(true);

      // Build a Set of all valid student IDs
      const validStudentIds = new Set();

      if (isFromRegisteredStudents) {
        registeredStudents.forEach((student) => {
          const id = student._id || student.id || student.prn;
          if (id) validStudentIds.add(id.toString());
        });
      } else {
        const clsArray = Array.isArray(college?.classes) ? college.classes : [];
        clsArray.forEach((cls) => {
          const students = Array.isArray(cls.students) ? cls.students : [];
          students.forEach((student) => {
            const id = student._id || student.id || student.prn;
            if (id) validStudentIds.add(id.toString());
          });
        });
      }

      const collegeId = route?.params?.collegeId || college?._id || college?.id;

      // Always use college-specific endpoint; append ?date= for per-day filtering
      const dateParam = date ? `?date=${date}` : "";
      const attendanceUrl = collegeId
        ? `${api.ngo_host}/event/${eventId}/college/${collegeId}/attendance${dateParam}`
        : `${api.ngo_host}/event/${eventId}/attendance${dateParam}`;

      console.log("Fetching attendance from:", attendanceUrl);

      const response = await fetch(attendanceUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        let allAttendedStudentIds = [];

        if (data?.data?.attendance?.[0]?.students) {
          // College-specific format: only students with attendanceMarkedAt are truly present
          allAttendedStudentIds = data.data.attendance[0].students
            .filter((student) => student.attendanceMarkedAt)
            .map((student) => (student.studentId || student._id).toString());
        } else {
          allAttendedStudentIds =
            data?.data?.attendance?.map((record) =>
              (record._id || record.id).toString()
            ) || [];
        }

        const filteredStudentIds = allAttendedStudentIds.filter((id) =>
          validStudentIds.has(id)
        );

        setPresentIds(new Set(filteredStudentIds));
        setOriginallyPresentIds(new Set(filteredStudentIds));
      } else {
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

  // When selected date changes, reset and re-fetch
  const handleDateSelect = (date) => {
    if (date === selectedDate) return;
    setPresentIds(new Set());
    setOriginallyPresentIds(new Set());
    setSelectedDate(date);
    // useEffect will trigger fetchExistingAttendance via selectedDate dependency
  };

  const handleSubmit = () => {
    if (Platform.OS === "web") {
      const label = selectedDate ? formatDateLabel(selectedDate) : "this event";
      const confirmed = window.confirm(
        `Are you sure you want to submit attendance for ${label}? This action is irreversible and cannot be undone.`
      );
      if (confirmed) submitAttendance();
    } else {
      const label = selectedDate ? formatDateLabel(selectedDate) : "this event";
      Alert.alert(
        "Confirm Submission",
        `Are you sure you want to submit attendance for ${label}? This action is irreversible and cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Submit", onPress: () => submitAttendance(), style: "destructive" },
        ]
      );
    }
  };

  const submitAttendance = async () => {
    const presentArray = Array.from(presentIds);
    const collegeId = college?._id || college?.id || route?.params?.collegeId;

    const reqBody = {
      studentIds: presentArray,
      eventId: eventId,
      collegeId: collegeId,
      attendanceDate: selectedDate, // include the specific day
    };
    console.log("Submitting attendance:", reqBody);

    try {
      const response = await fetch(api.attendanceAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
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

      const label = selectedDate ? formatDateLabel(selectedDate) : "the event";
      if (Platform.OS === "web") {
        window.alert(`Attendance for ${label} has been submitted successfully!`);
        goBack();
      } else {
        Alert.alert("Success", `Attendance for ${label} has been submitted successfully!`, [
          { text: "OK", onPress: () => goBack() },
        ]);
      }
    } catch (err) {
      console.log("Error in submitting attendance:", err);
      if (Platform.OS === "web") {
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
      const id = student._id || student.id || student.prn || Math.random().toString();
      const prn = student.prn || student.PRN || student.roll || student.regNo || "—";
      const dept = student.department || student.dept || "—";
      const name = student.name || student.fullName || "Unknown";
      const isPresent = presentIds.has(id);
      const isLocked = originallyPresentIds.has(id);

      return (
        <View
          key={id}
          className="p-4 rounded-xl mb-3 border"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-base font-bold mb-1" style={{ color: colors.header }}>
                {name}
              </Text>
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
                <Text className="font-bold text-xs" style={{ color: isPresent ? "#fff" : colors.textPrimary }}>
                  {isLocked ? "Marked" : "Present"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => markAbsent(id)}
                disabled={isLocked}
                className="px-4 py-2 rounded-xl border"
                style={{
                  borderColor: !isPresent ? colors.error || "#ef4444" : colors.border,
                  backgroundColor: !isPresent ? colors.error || "#ef4444" : colors.cardBg,
                  opacity: isLocked ? 0.6 : 1,
                }}
              >
                <Text className="font-bold text-xs" style={{ color: !isPresent ? "#fff" : colors.textPrimary }}>
                  Absent
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    });
  };

  const presentCount = presentIds.size;
  const newStudentsCount = Array.from(presentIds).filter(
    (id) => !originallyPresentIds.has(id)
  ).length;

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : "#fff" }}
    >
      {/* Header Section */}
      <View
        className="px-5 pt-8 pb-4"
        style={{ backgroundColor: colors.cardBg, borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => goBack()}
            className="p-2 rounded-full border mr-3"
            style={{ borderColor: colors.border, backgroundColor: colors.backgroundColors?.[0] || "#fff" }}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Stats Badge */}
          <View
            className="px-4 py-2 rounded-xl"
            style={{ backgroundColor: colors.accent + "15", borderWidth: 1, borderColor: colors.accent + "30" }}
          >
            <Text className="font-bold text-sm" style={{ color: colors.accent }}>
              {presentCount} Present
            </Text>
          </View>
        </View>

        <Text className="text-2xl font-extrabold mb-1" style={{ color: colors.header }}>
          {college?.name?.toUpperCase() || college?.collegeName?.toUpperCase() || "College"}
        </Text>
        <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>
          Mark Attendance
        </Text>

        {/* ── Day selector for multi-day events ─────────────────────────── */}
        {isMultiDay && (
          <View className="mb-1">
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
              SELECT DATE
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {eventDates.map((date) => {
                const isSelected = date === selectedDate;
                const isPast = date <= todayString();
                return (
                  <TouchableOpacity
                    key={date}
                    onPress={() => handleDateSelect(date)}
                    disabled={!isPast}
                    className="mr-2 px-4 py-2 rounded-xl border"
                    style={{
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? colors.accent : colors.cardBg,
                      opacity: isPast ? 1 : 0.4,
                    }}
                  >
                    <Text
                      className="font-bold text-xs"
                      style={{ color: isSelected ? "#fff" : colors.textPrimary }}
                    >
                      {formatDateLabel(date)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
        {/* ────────────────────────────────────────────────────────────────── */}
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
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                FILTER BY CLASS
              </Text>
              <TouchableOpacity
                onPress={() => setShowDropdown((s) => !s)}
                className="px-4 py-3 rounded-xl border flex-row items-center justify-between"
                style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}
              >
                <Text className="font-semibold" style={{ color: colors.textPrimary }}>
                  {selectedClass}
                </Text>
                <Text style={{ color: colors.textSecondary }}>{showDropdown ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {showDropdown && (
                <View
                  className="mt-2 rounded-xl border overflow-hidden"
                  style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}
                >
                  <ScrollView className="max-h-55" showsVerticalScrollIndicator={true}>
                    {classes.map((className) => (
                      <TouchableOpacity
                        key={className}
                        onPress={() => {
                          setSelectedClass(className);
                          setShowDropdown(false);
                        }}
                        className="px-4 py-3 border-b"
                        style={{
                          backgroundColor: selectedClass === className ? colors.accent : "transparent",
                          borderColor: colors.border,
                        }}
                      >
                        <Text
                          className="font-semibold"
                          style={{ color: selectedClass === className ? "#fff" : colors.textPrimary }}
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
                      <Text className="text-sm font-bold mb-3 uppercase" style={{ color: colors.textSecondary }}>
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
                disabled={newStudentsCount === 0}
                className="p-4 rounded-xl items-center"
                style={{
                  backgroundColor: newStudentsCount === 0 ? colors.border : colors.accent,
                  opacity: newStudentsCount === 0 ? 0.5 : 1,
                }}
              >
                <Text className="text-white font-bold text-base">
                  {selectedDate && isMultiDay
                    ? `Submit for ${formatDateLabel(selectedDate)} ${newStudentsCount > 0 ? `(${newStudentsCount} new)` : "(No new students)"}`
                    : `Submit Attendance ${newStudentsCount > 0 ? `(${newStudentsCount} new)` : "(No new students)"}`}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}
