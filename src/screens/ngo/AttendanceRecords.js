import React, { useState, useEffect, useContext, Platform } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform as RNPlatform,
  ScrollView,
  TextInput,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";

import { ngo_host } from "../../../apis/api";
import { useTheme } from "../../context/ThemeContext";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import AnimatedSearch from "../../components/AnimatedSearch";
// Platform-specific imports
let RealFileSystem, RealSharing;
if (RNPlatform.OS !== "web") {
  RealFileSystem = require("expo-file-system/legacy");
  RealSharing = require("expo-sharing");
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function toDateString(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function getEventDates(startDate, endDate) {
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const end = new Date(endDate || startDate); end.setHours(0, 0, 0, 0);
  const dates = [];
  const cur = new Date(start);
  while (cur <= end) { dates.push(toDateString(cur)); cur.setDate(cur.getDate() + 1); }
  return dates;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AttendanceRecords({ route = {} }) {
  // Helper function to save file to local storage
  const saveFile = async (filename, base64Data) => {
    if (RNPlatform.OS === "web") return;

    try {
      if (RNPlatform.OS === "android") {
        // 1. Request permission to pick a folder
        const permissions = await RealFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
          // 2. Create the file in the selected folder
          const uri = await RealFileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            filename,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );

          // 3. Write the data
          await RealFileSystem.writeAsStringAsync(uri, base64Data, {
            encoding: 'base64',
          });

          alert("File saved successfully!");
        } else {
          alert("Export cancelled: No folder selected.");
        }
      } else {
        // iOS: Use share sheet which has "Save to Files"
        const filepath = `${RealFileSystem.documentDirectory}${filename}`;
        await RealFileSystem.writeAsStringAsync(filepath, base64Data, {
          encoding: 'base64',
        });

        await RealSharing.shareAsync(filepath, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Data",
          UTI: "com.microsoft.excel.xlsx",
        });
      }
    } catch (error) {
      console.error("File save error:", error);
      alert("Error saving file: " + error.message);
    }
  };

  const { params = {} } = route;
  const event = params.event;
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const { goBack } = useContext(NavigationContext);
  const { user, accessToken } = useContext(AuthContext);

  const [attendanceData, setAttendanceData] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("card"); // "table" or "card"
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ── Multi-day date selection ───────────────────────────────────────────────
  const eventDates = React.useMemo(() => {
    const start = event?.startDate || event?.eventDate;
    const end = event?.endDate || start;
    if (!start) return [];
    return getEventDates(start, end);
  }, [event]);
  const isMultiDay = eventDates.length > 1;
  const [selectedDate, setSelectedDate] = useState(null);

  // Default to today (or first day) when event dates are computed
  useEffect(() => {
    if (eventDates.length > 0 && selectedDate === null) {
      const today = toDateString(new Date());
      setSelectedDate(eventDates.includes(today) ? today : eventDates[0]);
    }
  }, [eventDates]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (event && event._id) {
      fetchAttendance(selectedDate);
      fetchRegisteredStudents();
    } else {
      setLoading(false);
      setError("Event data not available");
    }
  }, [event, selectedDate]);

  const fetchAttendance = async (date) => {
    try {
      setLoading(true);
      const dateParam = date ? `?date=${date}` : "";
      const response = await fetch(
        `${ngo_host}/event/${event._id}/attendance${dateParam}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch attendance data");
      }
      const data = await response.json();
      setAttendanceData(data?.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredStudents = async () => {
    try {
      const response = await fetch(
        `${ngo_host}/events/${event._id}/registered-students`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        // Flatten registered students from all colleges
        const allRegistered = data?.data?.registeredStudents?.flatMap(college =>
          college.students.map(student => ({
            ...student,
            collegeName: college.college.name,
          }))
        ) || [];
        setRegisteredStudents(allRegistered);
      }
    } catch (err) {
      console.log("Could not fetch registered students:", err);
    }
  };

  // Helper to fetch attendance data for a specific date (internal use for export)
  const fetchAttendanceForExport = async (date) => {
    const dateParam = date ? `?date=${date}` : "";
    const response = await fetch(
      `${ngo_host}/event/${event._id}/attendance${dateParam}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) throw new Error(`Failed to fetch attendance for ${date}`);
    const res = await response.json();
    return res.data;
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);

      const workbook = new ExcelJS.Workbook();
      const todayString = toDateString(new Date());

      // 1. Prepare NGO Info
      const ngoName = user?.name || "NGO";
      const ngoAddress = user?.address || "Address not available";
      const profileImageUrl = user?.profileImage || null;

      // 2. Fetch Image once
      let imageId = null;
      if (profileImageUrl) {
        try {
          let base64Data = "";
          let extension = "png";
          if (profileImageUrl.toLowerCase().includes("jpg") || profileImageUrl.toLowerCase().includes("jpeg")) {
            extension = "jpeg";
          }

          if (RNPlatform.OS === "web") {
            const response = await fetch(profileImageUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            base64Data = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result.toString().split(",")[1]);
            });
          } else {
            const fileUri = `${RealFileSystem.cacheDirectory}temp_logo.${extension}`;
            await RealFileSystem.downloadAsync(profileImageUrl, fileUri);
            base64Data = await RealFileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
          }

          if (base64Data) {
            imageId = workbook.addImage({ base64: base64Data, extension: extension });
          }
        } catch (err) {
          console.log("Image load error:", err);
        }
      }

      // 3. Loop through all dates to create sheets
      const datesToExport = eventDates.length > 0 ? eventDates : [null];

      for (const date of datesToExport) {
        const sheetData = await fetchAttendanceForExport(date);
        const sheetName = date ? formatDateLabel(date).replace(/,/g, "").replace(/\s+/g, "_") : "Attendance";
        const worksheet = workbook.addWorksheet(sheetName);

        // Layout NGO Logo
        if (imageId) {
          worksheet.addImage(imageId, {
            tl: { col: 0, row: 1 },
            br: { col: 1, row: 4 },
            editAs: "oneCell",
          });
        } else {
          worksheet.getCell("A2").value = "NGO Logo";
        }

        // NGO Name & Address
        worksheet.mergeCells("B2:E2");
        const nc = worksheet.getCell("B2");
        nc.value = ngoName;
        nc.font = { bold: true, size: 16 };
        nc.alignment = { vertical: "middle" };

        worksheet.mergeCells("B3:E3");
        const ac = worksheet.getCell("B3");
        ac.value = ngoAddress;
        ac.font = { color: { argb: "FF666666" }, size: 11 };
        ac.alignment = { vertical: "top", wrapText: true };

        // Event Header
        worksheet.mergeCells("A5:F5");
        const eh = worksheet.getCell("A5");
        eh.value = "EVENT ATTENDANCE RECORD";
        eh.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
        eh.font = { color: { argb: "FFFFFFFF" }, bold: true };
        eh.alignment = { horizontal: "center" };

        // Event Info Rows
        const center = { horizontal: "center" };
        worksheet.mergeCells("A6:F6");
        const r6 = worksheet.getCell("A6");
        r6.value = `Event: ${sheetData.event?.aim || "N/A"}`;
        r6.font = { bold: true, size: 14 };
        r6.alignment = center;

        worksheet.mergeCells("A7:F7");
        const r7 = worksheet.getCell("A7");
        r7.value = `Location: ${sheetData.event?.location || "N/A"}`;
        r7.alignment = center;

        worksheet.mergeCells("A8:F8");
        const r8 = worksheet.getCell("A8");
        const displayDate = date ? new Date(date).toLocaleDateString() : "All Records";
        r8.value = `Attendance Date: ${displayDate}`;
        r8.font = { italic: true };
        r8.alignment = center;

        worksheet.mergeCells("A9:F9");
        const r9 = worksheet.getCell("A9");
        r9.value = `Total Present: ${sheetData.totalStudentsPresent || 0}`;
        r9.alignment = center;

        // Table Header
        const headerRow = worksheet.getRow(11);
        headerRow.values = ["Student Name", "College", "Department", "Class", "Status", "Marked Time"];
        headerRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
          cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          cell.alignment = center;
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        });

        // Data Rows
        const isPast = isDatePast(date);
        const attendedIds = new Set((sheetData.attendance || []).filter(s => s.attendanceMarkedAt).map(s => s._id));

        const presentRows = (sheetData.attendance || [])
          .filter(s => s.attendanceMarkedAt)
          .map(s => ({
            name: s.name || "",
            college: sheetData.colleges?.find(col => col && col.classes && col.classes.includes(s.classId?._id))?.name || "",
            dept: s.department || "",
            class: s.classId?.className || "",
            status: "Present",
            time: new Date(s.attendanceMarkedAt).toLocaleTimeString(),
          }));

        const absentRows = registeredStudents
          .filter(s => !attendedIds.has(s._id))
          .map(s => ({
            name: s.name || "",
            college: s.collegeName || "",
            dept: s.department || "",
            class: s.class?.className || s.class?.name || "",
            status: isPast ? "Absent" : "Registered",
            time: "N/A",
          }));

        const allRows = [...presentRows, ...absentRows];
        allRows.forEach((student, index) => {
          const row = worksheet.addRow([
            student.name,
            student.college,
            student.dept,
            student.class,
            student.status,
            student.time,
          ]);

          const bgColor = index % 2 === 0 ? "FFFFFFFF" : "FFF2F2F2";
          row.eachCell((cell, colNum) => {
            if (colNum === 5) {
              const statusArgb = student.status === "Present" ? "FF10b981" : student.status === "Absent" ? "FFef4444" : "FFf59e0b";
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusArgb } };
              cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
            } else {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
            }
            cell.alignment = center;
            cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
          });
        });

        worksheet.columns = [
          { width: 25 }, { width: 30 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 20 }
        ];
      }

      // 4. Save Workbook
      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `attendance_${event?.aim?.replace(/\s+/g, "_")}_full.xlsx`;

      if (RNPlatform.OS === "web") {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename; a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const base64 = Buffer.from(buffer).toString("base64");
        await saveFile(filename, base64);
      }
      //alert("Multi-sheet export successful!");
    } catch (error) {
      console.error("Export Error:", error);
      alert("Failed to export: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };
  const getCollegeName = (classId) => {
    if (!classId) return "Unknown College";
    const college = attendanceData.colleges?.find((col) =>
      col && col.classes && col.classes.includes(classId)
    );
    return college ? college.name : "Unknown College";
  };

  // Returns true if the provided date string is in the past
  const isDatePast = (dateStr) => {
    if (!dateStr) return false;
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return targetDate < today;
  };

  // Color helper for status badges
  const getStatusStyle = (status) => {
    if (status === "Present") return { bg: "#10b981", text: "#fff" };
    if (status === "Absent") return { bg: "#ef4444", text: "#fff" };
    return { bg: "#f59e0b", text: "#fff" }; // Registered
  };

  // Merge registered students with attendance data
  const mergedStudents = React.useMemo(() => {
    // Determine if the currently viewed day is in the past
    const isDayPast = isDatePast(selectedDate);

    // Only students who were ACTUALLY marked present (have attendanceMarkedAt)
    const attendedIds = new Set(
      (attendanceData.attendance || [])
        .filter(s => s.attendanceMarkedAt)
        .map(s => s._id)
    );

    // Students who have been marked present (have attendanceMarkedAt)
    const presentStudents = (attendanceData.attendance || [])
      .filter(student => student.attendanceMarkedAt)
      .map(student => ({
        ...student,
        status: "Present",
        collegeName: getCollegeName(student.classId?._id),
      }));

    // Students who registered but haven't been marked present
    const registeredOnly = registeredStudents
      .filter(student => !attendedIds.has(student._id))
      .map(student => ({
        ...student,
        // If the specific day is past and student not marked present → Absent
        // Otherwise, they are still "Registered" (Pending) for today/future
        status: isDayPast ? "Absent" : "Registered",
        classId: student.class || {},
        attendanceMarkedAt: null,
      }));

    return [...presentStudents, ...registeredOnly];
  }, [attendanceData, registeredStudents, selectedDate]);

  // Filter merged students based on search query
  const filteredStudents = mergedStudents.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const collegeName = (item.collegeName || "").toLowerCase();

    return (
      item.name?.toLowerCase().includes(query) ||
      collegeName.includes(query) ||
      item.department?.toLowerCase().includes(query) ||
      item.classId?.className?.toLowerCase().includes(query) ||
      item.classId?.name?.toLowerCase().includes(query) ||
      item.status?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{
          backgroundColor: colors.backgroundColors
            ? colors.backgroundColors[0]
            : "#fff",
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textPrimary }}>
          Loading attendance records...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{
          backgroundColor: colors.backgroundColors
            ? colors.backgroundColors[0]
            : "#fff",
        }}
      >
        <Text className="text-red-500" style={{ color: colors.textPrimary }}>
          Error: {error}
        </Text>
      </View>
    );
  }

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
        {/* Back and Export Row */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity
            onPress={() => goBack()}
            className="p-2 rounded-full border"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.backgroundColors?.[0] || '#fff',
            }}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {attendanceData.attendance && attendanceData.attendance.length > 0 && (
            <TouchableOpacity
              onPress={exportToExcel}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl flex-row items-center"
              style={{
                backgroundColor: isExporting ? colors.textSecondary : colors.accent,
                height: 44,
              }}
            >
              <Text className="text-white font-bold text-sm">
                {isExporting ? "Exporting..." : "Export Excel"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Search Button */}
          {attendanceData.attendance && attendanceData.attendance.length > 0 && (
            <AnimatedSearch
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              colors={colors}
              containerStyle={{ marginBottom: 0, marginLeft: 8 }}
            />
          )}
        </View>

        {/* Event Title */}
        <Text className="text-2xl font-extrabold mb-2" style={{ color: colors.header }}>
          {attendanceData.event?.aim || "Event"}
        </Text>

        {/* Event Details */}
        <View className="mb-3">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-bold" style={{ color: colors.accent }}>📍 Location: </Text>
            <Text className="text-sm" style={{ color: colors.textPrimary }}>{attendanceData.event?.location || "N/A"}</Text>
          </View>
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-bold" style={{ color: colors.accent }}>📅 Duration: </Text>
            <Text className="text-sm" style={{ color: colors.textPrimary }}>
              {new Date(attendanceData.event?.startDate || attendanceData.event?.eventDate).toLocaleDateString()}
              {attendanceData.event?.endDate && attendanceData.event?.endDate !== attendanceData.event?.startDate && ` - ${new Date(attendanceData.event?.endDate).toLocaleDateString()}`}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-sm font-bold" style={{ color: colors.accent }}>⏰ Daily Timing: </Text>
            <Text className="text-sm" style={{ color: colors.textPrimary }}>{attendanceData.event?.startTime || "N/A"} - {attendanceData.event?.endTime || "N/A"}</Text>
          </View>
          {attendanceData.event?.spocName && (
            <View className="flex-row items-center mt-1">
              <Text className="text-sm font-bold" style={{ color: colors.accent }}>👤 Manager: </Text>
              <Text className="text-sm mr-4" style={{ color: colors.textPrimary }}>{attendanceData.event?.spocName}</Text>
              {attendanceData.event?.spocContact && (
                <>
                  <Text className="text-sm font-bold" style={{ color: colors.accent }}>📞 Contact: </Text>
                  <Text className="text-sm" style={{ color: colors.textPrimary }}>{attendanceData.event?.spocContact}</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* ── Day selector for multi-day events ───────────────────────── */}
        {isMultiDay && (
          <View className="mb-3">
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>VIEW BY DATE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {eventDates.map((date) => {
                const isSelected = date === selectedDate;
                return (
                  <TouchableOpacity
                    key={date}
                    onPress={() => setSelectedDate(date)}
                    className="mr-2 px-4 py-2 rounded-xl border"
                    style={{
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? colors.accent : colors.cardBg,
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
        {/* ─────────────────────────────────────────────────────────────── */}

        {/* Stats Card */}
        <View className="p-3 rounded-xl mb-3" style={{ backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '30' }}>
          <Text className="text-center font-bold text-lg" style={{ color: colors.accent }}>
            {mergedStudents.filter(s => s.status === "Present").length} Present
            {mergedStudents.filter(s => s.status === "Absent").length > 0
              ? ` · ${mergedStudents.filter(s => s.status === "Absent").length} Absent`
              : mergedStudents.filter(s => s.status === "Registered").length > 0
                ? ` · ${mergedStudents.filter(s => s.status === "Registered").length} Registered`
                : ""}
          </Text>
        </View>


        {/* View Toggle */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>VIEW MODE</Text>
          <View className="flex-row rounded-xl border" style={{ borderColor: colors.border, overflow: 'hidden' }}>
            <TouchableOpacity
              onPress={() => setViewMode("table")}
              className="px-4 py-2"
              style={{
                backgroundColor: viewMode === "table" ? colors.accent : colors.cardBg,
              }}
            >
              <Text className="font-bold text-xs" style={{ color: viewMode === "table" ? '#fff' : colors.textSecondary }}>Table</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("card")}
              className="px-4 py-2"
              style={{
                backgroundColor: viewMode === "card" ? colors.accent : colors.cardBg,
                borderLeftWidth: 1,
                borderLeftColor: colors.border,
              }}
            >
              <Text className="font-bold text-xs" style={{ color: viewMode === "card" ? '#fff' : colors.textSecondary }}>Cards</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View className="flex-1 px-5 pt-4">
        {mergedStudents.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-lg font-semibold mb-2" style={{ color: colors.textSecondary }}>No Records</Text>
            <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
              No students found for this event.
            </Text>
          </View>
        ) : viewMode === "table" ? (
          // TABLE VIEW
          <ScrollView horizontal showsHorizontalScrollIndicator={true} className="flex-1">
            <View>
              {/* Table Header */}
              <View
                className="flex-row p-3 rounded-xl mb-2"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="font-bold text-xs text-center px-2 text-white" style={{ width: 160 }}>
                  Student Name
                </Text>
                <Text className="font-bold text-xs text-center px-2 text-white" style={{ width: 180 }}>
                  College
                </Text>
                <Text className="font-bold text-xs text-center px-2 text-white" style={{ width: 140 }}>
                  Department
                </Text>
                <Text className="font-bold text-xs text-center px-2 text-white" style={{ width: 120 }}>
                  Class
                </Text>
                <Text className="font-bold text-xs text-center px-2 text-white" style={{ width: 100 }}>
                  Status
                </Text>
                <Text className="font-bold text-xs text-center px-2 text-white" style={{ width: 140 }}>
                  Marked Date
                </Text>
              </View>

              {/* Table Data Rows */}
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredStudents.map((item, index) => (
                  <View
                    key={item._id}
                    className="flex-row p-3 rounded-xl mb-2 border"
                    style={{
                      backgroundColor: index % 2 === 0 ? colors.cardBg : colors.backgroundColors?.[1] || '#f9f9f9',
                      borderColor: colors.border,
                    }}
                  >
                    <Text className="text-xs text-center px-2 font-semibold" style={{ color: colors.textPrimary, width: 160 }}>
                      {item.name}
                    </Text>
                    <Text className="text-xs text-center px-2" style={{ color: colors.textPrimary, width: 180 }}>
                      {item.collegeName || "Unknown"}
                    </Text>
                    <Text className="text-xs text-center px-2" style={{ color: colors.textSecondary, width: 140 }}>
                      {item.department || "N/A"}
                    </Text>
                    <Text className="text-xs text-center px-2" style={{ color: colors.textSecondary, width: 120 }}>
                      {item.classId?.className || item.classId?.name || "N/A"}
                    </Text>
                    <View className="px-2" style={{ width: 100, alignItems: 'center', justifyContent: 'center' }}>
                      <View className="px-2 py-1 rounded" style={{ backgroundColor: getStatusStyle(item.status).bg }}>
                        <Text className="text-xs font-bold" style={{ color: getStatusStyle(item.status).text }}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-center px-2" style={{ color: colors.textSecondary, width: 140 }}>
                      {item.attendanceMarkedAt
                        ? new Date(item.attendanceMarkedAt).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        ) : (
          // CARD VIEW
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {filteredStudents.map((item, index) => (
              <View
                key={item._id}
                className="p-4 rounded-xl mb-3 border"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                }}
              >
                {/* Student Name - Prominent */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base font-bold" style={{ color: colors.header }}>
                    {item.name}
                  </Text>
                  <View className="px-3 py-1 rounded-lg" style={{ backgroundColor: getStatusStyle(item.status).bg }}>
                    <Text className="text-xs font-bold" style={{ color: getStatusStyle(item.status).text }}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View className="gap-2">
                  <View className="flex-row items-center">
                    <Text className="text-xs font-semibold" style={{ color: colors.textSecondary, width: 100 }}>College:</Text>
                    <Text className="text-xs flex-1" style={{ color: colors.textPrimary }}>{item.collegeName || "Unknown"}</Text>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-xs font-semibold" style={{ color: colors.textSecondary, width: 100 }}>Department:</Text>
                    <Text className="text-xs flex-1" style={{ color: colors.textPrimary }}>{item.department || "N/A"}</Text>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-xs font-semibold" style={{ color: colors.textSecondary, width: 100 }}>Class:</Text>
                    <Text className="text-xs flex-1" style={{ color: colors.textPrimary }}>{item.classId?.className || item.classId?.name || "N/A"}</Text>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-xs font-semibold" style={{ color: colors.textSecondary, width: 100 }}>Date:</Text>
                    <Text className="text-xs flex-1" style={{ color: colors.accent }}>
                      {item.attendanceDate
                        ? formatDateLabel(item.attendanceDate)
                        : item.attendanceMarkedAt
                          ? new Date(item.attendanceMarkedAt).toLocaleDateString()
                          : "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}