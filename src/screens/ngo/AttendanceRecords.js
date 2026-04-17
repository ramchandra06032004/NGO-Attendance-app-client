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

  useEffect(() => {
    if (event && event._id) {
      fetchAttendance();
      fetchRegisteredStudents();
    } else {
      setLoading(false);
      setError("Event data not available");
    }
  }, [event]);

  const fetchAttendance = async () => {
    try {
      const response = await fetch(
        `${ngo_host}/event/${event._id}/attendance`,
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

  // ✅ UPDATED FUNCTION: Uses exceljs to embed images
  const exportToExcel = async () => {
    try {
      if (
        !attendanceData.attendance ||
        attendanceData.attendance.length === 0
      ) {
        alert("No attendance records to export");
        return;
      }

      // 1. Initialize Workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Attendance");

      // Prepare Data
      const ngoName = user?.name || attendanceData.event?.ngo?.name || "NGO";
      const ngoAddress =
        user?.address ||
        attendanceData.event?.ngo?.address ||
        "Address not available";
      const profileImageUrl =
        user?.profileImage || attendanceData.event?.ngo?.profileImage || null;

      // 2. Handle Image Embedding (Fixed for Mobile & Web)
      if (profileImageUrl) {
        try {
          let base64Data = "";
          let extension = "png";

          // Simple extension detection
          if (profileImageUrl.toLowerCase().includes("jpg") || profileImageUrl.toLowerCase().includes("jpeg")) {
            extension = "jpeg";
          }

          if (RNPlatform.OS === "web") {
            // 🌍 WEB: Use Fetch + FileReader (Requires CORS allowed on Bucket)
            const response = await fetch(profileImageUrl);
            const blob = await response.blob();

            const reader = new FileReader();
            reader.readAsDataURL(blob);

            await new Promise((resolve) => {
              reader.onloadend = () => {
                // Remove the "data:image/png;base64," prefix
                base64Data = reader.result.toString().split(",")[1];
                resolve();
              };
            });

          } else {
            // 📱 MOBILE: Use FileSystem (More stable than fetch blob)
            const fileUri = `${FileSystem.cacheDirectory}temp_excel_image.${extension}`;

            // Download to local cache first
            await FileSystem.downloadAsync(profileImageUrl, fileUri);

            // Read as Base64
            base64Data = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }

          // Add to workbook
          if (base64Data) {
            const imageId = workbook.addImage({
              base64: base64Data,
              extension: extension,
            });

            worksheet.addImage(imageId, {
              tl: { col: 0, row: 1 }, // A2
              br: { col: 1, row: 4 }, // B5
              editAs: "oneCell",
            });
          }

        } catch (err) {
          console.log("Could not load image for Excel:", err);
          worksheet.getCell("A2").value = "Image Error (See Logs)";
        }
      } else {
        worksheet.getCell("A2").value = "No Image";
      }
      // 3. Layout: Text Data (Matches previous design)

      // Name (Merged B2:E2)
      worksheet.mergeCells("B2:E2");
      const nameCell = worksheet.getCell("B2");
      nameCell.value = ngoName;
      nameCell.font = { bold: true, size: 16 };
      nameCell.alignment = { vertical: "middle" };

      // Address (Merged B3:E3)
      worksheet.mergeCells("B3:E3");
      const addrCell = worksheet.getCell("B3");
      addrCell.value = ngoAddress;
      addrCell.font = { color: { argb: "FF666666" }, size: 11 };
      addrCell.alignment = { vertical: "top", wrapText: true };

      // EVENT DETAILS Header (Merged A5:E5)
      worksheet.mergeCells("A5:E5");
      const eventHeader = worksheet.getCell("A5");
      eventHeader.value = "EVENT DETAILS";
      eventHeader.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      eventHeader.font = { color: { argb: "FFFFFFFF" }, bold: true };
      eventHeader.alignment = { horizontal: "center" };

      // Event Info Rows
      const centerStyle = { horizontal: "center" };

      const r6 = worksheet.getCell("A6");
      r6.value = `Event: ${attendanceData.event?.aim || "N/A"}`;
      r6.font = { bold: true, size: 14 };
      r6.alignment = centerStyle;
      worksheet.mergeCells("A6:E6");

      const r7 = worksheet.getCell("A7");
      r7.value = `Location: ${attendanceData.event?.location || "N/A"}`;
      r7.alignment = centerStyle;
      worksheet.mergeCells("A7:E7");

      const dateRangeStr = (attendanceData.event?.startDate ?
        (new Date(attendanceData.event.startDate).toLocaleDateString() + (attendanceData.event.endDate && attendanceData.event.endDate !== attendanceData.event.startDate ? ` - ${new Date(attendanceData.event.endDate).toLocaleDateString()}` : ""))
        : new Date(attendanceData.event?.eventDate).toLocaleDateString());

      const r8 = worksheet.getCell("A8");
      r8.value = `Date: ${dateRangeStr}`;
      r8.alignment = centerStyle;
      worksheet.mergeCells("A8:E8");

      const r9 = worksheet.getCell("A9");
      r9.value = `Total Students Present: ${attendanceData.totalStudentsPresent || 0}`;
      r9.alignment = centerStyle;
      worksheet.mergeCells("A9:E9");

      // 4. Table Header (Row 11)
      const headerRow = worksheet.getRow(11);
      headerRow.values = [
        "Student Name",
        "College",
        "Department",
        "Class",
        "Status",
        "Marked Date",
      ];

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // 5. Add Data Rows — include all merged students (Present + Absent/Registered)
      const eventPastForExcel = (() => {
        if (!attendanceData.event?.eventDate) return false;
        const ed = new Date(attendanceData.event.eventDate);
        ed.setHours(0, 0, 0, 0);
        const td = new Date(); td.setHours(0, 0, 0, 0);
        return ed < td;
      })();

      // Build attended set
      const attendedIdsExcel = new Set(
        (attendanceData.attendance || [])
          .filter(s => s.attendanceMarkedAt)
          .map(s => s._id)
      );

      // Present students
      const presentRows = (attendanceData.attendance || [])
        .filter(s => s.attendanceMarkedAt)
        .map(s => ({
          name: s.name || "",
          collegeName: attendanceData.colleges?.find(col => col && col.classes && col.classes.includes(s.classId?._id))?.name || "",
          department: s.department || "",
          className: s.classId?.className || "",
          status: "Present",
          markedAt: new Date(s.attendanceMarkedAt).toLocaleDateString(),
        }));

      // Registered / Absent students
      const registeredRows = registeredStudents
        .filter(s => !attendedIdsExcel.has(s._id))
        .map(s => ({
          name: s.name || "",
          collegeName: s.collegeName || "",
          department: s.department || "",
          className: s.class?.className || s.class?.name || "",
          status: eventPastForExcel ? "Absent" : "Registered",
          markedAt: "N/A",
        }));

      const allRows = [...presentRows, ...registeredRows];

      allRows.forEach((student, index) => {
        const row = worksheet.addRow([
          student.name,
          student.collegeName,
          student.department,
          student.className,
          student.status,
          student.markedAt,
        ]);

        // Alternating Row Colors
        const bgColor = index % 2 === 0 ? "FFFFFFFF" : "FFF2F2F2";
        row.eachCell((cell, colNumber) => {
          // Status column (col 5) gets color-coded
          if (colNumber === 5) {
            const statusArgb =
              student.status === "Present" ? "FF10b981" :
                student.status === "Absent" ? "FFef4444" :
                  "FFf59e0b"; // Registered
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusArgb } };
            cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          } else {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
          }
          cell.alignment = { horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Adjust Column Widths
      worksheet.columns = [
        { width: 25 }, // Name
        { width: 30 }, // College
        { width: 20 }, // Dept
        { width: 15 }, // Class
        { width: 15 }, // Status
        { width: 20 }, // Date
      ];

      // 6. Write & Save File
      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `attendance_${attendanceData.event?.aim?.replace(
        /\s+/g,
        "_"
      )}.xlsx`;

      if (RNPlatform.OS === "web") {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        window.URL.revokeObjectURL(url);
        alert("Export Successful!");
      } else {
        // Mobile: Use Storage Access Framework for Android, Share for iOS
        const base64 = Buffer.from(buffer).toString("base64");

        if (RNPlatform.OS === "android") {
          // Android: Let user choose where to save
          await saveFile(filename, base64);
        } else {
          // iOS: Use share sheet
          const fileUri = `${RealFileSystem.documentDirectory}${filename}`;
          await RealFileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: RealFileSystem.EncodingType.Base64,
          });

          await RealSharing.shareAsync(fileUri, {
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            dialogTitle: "Export Attendance",
            UTI: "com.microsoft.excel.xlsx",
          });
        }
      }
    } catch (error) {
      console.error("Export Error:", error);
      alert("Failed to export: " + error.message);
    }
  };
  const getCollegeName = (classId) => {
    if (!classId) return "Unknown College";
    const college = attendanceData.colleges?.find((col) =>
      col && col.classes && col.classes.includes(classId)
    );
    return college ? college.name : "Unknown College";
  };

  // Returns true if the event has already concluded
  const isEventPast = () => {
    const dateToCheck = attendanceData.event?.endDate || attendanceData.event?.startDate || attendanceData.event?.eventDate;
    if (!dateToCheck) return false;
    const eventDate = new Date(dateToCheck);
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  };

  // Color helper for status badges
  const getStatusStyle = (status) => {
    if (status === "Present") return { bg: "#10b981", text: "#fff" };
    if (status === "Absent") return { bg: "#ef4444", text: "#fff" };
    return { bg: "#f59e0b", text: "#fff" }; // Registered
  };

  // Merge registered students with attendance data
  const mergedStudents = React.useMemo(() => {
    const eventPast = isEventPast();

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
        collegeName: getCollegeName(student.classId._id),
      }));

    // Students who registered but haven't been marked present
    const registeredOnly = registeredStudents
      .filter(student => !attendedIds.has(student._id))
      .map(student => ({
        ...student,
        // If event is past and not marked present → Absent
        status: eventPast ? "Absent" : "Registered",
        classId: student.class || {},
        attendanceMarkedAt: null,
      }));

    return [...presentStudents, ...registeredOnly];
  }, [attendanceData, registeredStudents]);

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
            className="px-4 py-2 rounded-xl border flex-row items-center"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.backgroundColors?.[0] || '#fff',
            }}
          >
            <Text className="font-semibold" style={{ color: colors.textPrimary }}>← Back</Text>
          </TouchableOpacity>

          {attendanceData.attendance && attendanceData.attendance.length > 0 && (
            <TouchableOpacity
              onPress={exportToExcel}
              className="px-4 py-2 rounded-xl flex-row items-center"
              style={{
                backgroundColor: colors.accent,
                height: 44,
              }}
            >
              <Text className="text-white font-bold text-sm">Export Excel</Text>
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
                    <Text className="text-xs font-semibold" style={{ color: colors.textSecondary, width: 100 }}>Marked:</Text>
                    <Text className="text-xs flex-1" style={{ color: colors.accent }}>
                      {item.attendanceMarkedAt
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