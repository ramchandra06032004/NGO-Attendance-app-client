import React, { useState, useEffect, useContext, Platform } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform as RNPlatform,
  ScrollView,
} from "react-native";
import * as XLSX from "xlsx";
import { ngo_host } from "../../../apis/api";
import { useTheme } from "../../context/ThemeContext";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";

// Platform-specific imports
let FileSystem, Sharing;
if (RNPlatform.OS !== "web") {
  FileSystem = require("expo-file-system");
  Sharing = require("expo-sharing");
}

export default function AttendanceRecords({ route = {} }) {
  const { params = {} } = route;
  const event = params.event;
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const { goBack } = useContext(NavigationContext);
  const { user } = useContext(AuthContext);

  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event && event._id) {
      fetchAttendance();
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

  const exportToExcel = async () => {
    try {
      if (!attendanceData.attendance || attendanceData.attendance.length === 0) {
        alert("No attendance records to export");
        return;
      }

      const wb = XLSX.utils.book_new();

      const ngoName = user?.name || attendanceData.event?.ngo?.name || "NGO";
      const ngoAddress = user?.address || attendanceData.event?.ngo?.address || "Address not available";
      const eventName = attendanceData.event?.aim || "N/A";
      const eventLocation = attendanceData.event?.location || "N/A";
      const eventDate = new Date(attendanceData.event?.eventDate).toLocaleDateString() || "N/A";
      const totalPresent = attendanceData.totalStudentsPresent || 0;

      // Create worksheet with data
      const ws = XLSX.utils.aoa_to_sheet([
        [],
        [ngoName],
        [ngoAddress],
        [],
        ["EVENT DETAILS"],
        [`Event: ${eventName}`],
        [`Location: ${eventLocation}`],
        [`Date: ${eventDate}`],
        [`Total Students Present: ${totalPresent}`],
        [],
        ["Student Name", "College", "Department", "Class", "Attendance Marked Date"],
        ...attendanceData.attendance.map((student) => [
          student.name || "",
          getCollegeName(student.classId._id) || "",
          student.department || "",
          student.classId?.className || "",
          student.attendanceMarkedAt
            ? new Date(student.attendanceMarkedAt).toLocaleDateString()
            : "N/A",
        ]),
      ]);

      // Set column widths
      ws["!cols"] = [
        { wch: 25 },
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 22 },
      ];

      // Set row heights
      ws["!rows"] = [
        { hpx: 15 },
        { hpx: 32 },
        { hpx: 24 },
        { hpx: 10 },
        { hpx: 28 },
        { hpx: 24 },
        { hpx: 22 },
        { hpx: 22 },
        { hpx: 22 },
        { hpx: 10 },
        { hpx: 28 },
      ];

      if (!ws["!merges"]) ws["!merges"] = [];

      const styleCell = (cell, options = {}) => {
        const {
          bold = false,
          size = 11,
          color = "000000",
          bgColor = "FFFFFF",
          align = "center",
        } = options;

        ws[cell] = ws[cell] || {};
        ws[cell].s = {
          font: {
            bold: bold,
            sz: size,
            color: { rgb: color },
          },
          fill: {
            fgColor: { rgb: bgColor },
          },
          alignment: {
            horizontal: align,
            vertical: "center",
            wrapText: true,
          },
        };
      };

      styleCell("A2", { bold: true, size: 18, color: "1F1F1F", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });

      styleCell("A3", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 4 } });

      styleCell("A5", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      ws["!merges"].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 4 } });

      styleCell("A6", { bold: true, size: 14, color: "1F1F1F", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 5, c: 0 }, e: { r: 5, c: 4 } });

      styleCell("A7", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 6, c: 0 }, e: { r: 6, c: 4 } });

      styleCell("A8", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 7, c: 0 }, e: { r: 7, c: 4 } });

      styleCell("A9", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 8, c: 0 }, e: { r: 8, c: 4 } });

      styleCell("A11", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("B11", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("C11", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("D11", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("E11", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });

      attendanceData.attendance.forEach((row, idx) => {
        const rowNum = 12 + idx;
        const bgColor = idx % 2 === 0 ? "FFFFFF" : "F2F2F2";
        
        styleCell(`A${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`B${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`C${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`D${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`E${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
      });

      XLSX.utils.book_append_sheet(wb, ws, "Attendance");

      const filename = `attendance_${event?.aim?.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`;

      if (RNPlatform.OS === "web") {
        XLSX.writeFile(wb, filename);
        alert("Attendance records exported successfully!");
      } else {
        const wbout = XLSX.write(wb, {
          type: "base64",
          bookType: "xlsx",
        });

        const filepath = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(filepath, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(filepath, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Attendance Records",
          UTI: "com.microsoft.excel.xlsx",
        });

        alert("Attendance records exported successfully!");
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export attendance: " + error.message);
    }
  };

  const getCollegeName = (classId) => {
    const college = attendanceData.colleges?.find((col) =>
      col.classes.includes(classId)
    );
    return college ? college.name : "Unknown College";
  };

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
      className="flex-1 p-5"
      style={{
        backgroundColor: colors.backgroundColors
          ? colors.backgroundColors[0]
          : "#fff",
      }}
    >
      {/* Header with Back and Export buttons */}
      <View className="flex-row justify-between items-center mb-4 gap-2">
        <TouchableOpacity
          onPress={() => goBack()}
          className="px-2.5 py-1.5 rounded-lg border"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.cardBg,
          }}
        >
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>

        {attendanceData.attendance && attendanceData.attendance.length > 0 && (
          <TouchableOpacity
            onPress={exportToExcel}
            className="px-3.5 py-1.5 rounded-lg"
            style={{
              backgroundColor: colors.accent,
            }}
          >
            <Text className="text-white font-semibold text-sm">Export to Excel sheet</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-2xl font-bold mb-3" style={{ color: colors.header }}>
        Attendance Records for {attendanceData.event?.aim || "Event"}
      </Text>
      <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
        📍 Location: {attendanceData.event?.location}
      </Text>
      <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
        📅 Date:{" "}
        {new Date(attendanceData.event?.eventDate).toLocaleDateString()}
      </Text>
      <Text className="text-base font-bold mb-5" style={{ color: colors.textPrimary }}>
        Total Students Present: {attendanceData.totalStudentsPresent}
      </Text>
      {!attendanceData.attendance || attendanceData.attendance.length === 0 ? (
        <Text className="text-center mt-5 text-base" style={{ color: colors.textSecondary }}>
          No attendance records found.
        </Text>
      ) : (
        <>
          {/* Horizontal Scrolling Table */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true} className="flex-1">
            <View>
              {/* Table Header */}
              <View
                className="flex-row p-2.5 rounded-lg mb-0.5"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="font-bold text-xs text-center px-1 text-white" style={{ width: 150 }}>
                  Student
                </Text>
                <Text className="font-bold text-xs text-center px-1 text-white" style={{ width: 150 }}>
                  College
                </Text>
                <Text className="font-bold text-xs text-center px-1 text-white" style={{ width: 120 }}>
                  Department
                </Text>
                <Text className="font-bold text-xs text-center px-1 text-white" style={{ width: 120 }}>
                  Class
                </Text>
                <Text className="font-bold text-xs text-center px-1 text-white" style={{ width: 130 }}>
                  Marked Date
                </Text>
              </View>

              {/* Table Data Rows */}
              {attendanceData.attendance.map((item, index) => (
                <View
                  key={item._id}
                  className="flex-row p-2.5 rounded-lg mb-0.5 border items-center"
                  style={{
                    backgroundColor: index % 2 === 0 ? colors.cardBg : colors.backgroundColors?.[1] || '#f9f9f9',
                    borderColor: colors.border,
                  }}
                >
                  <Text className="text-xs text-center px-1" style={{ color: colors.textPrimary, width: 150 }}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-center px-1" style={{ color: colors.textPrimary, width: 150 }}>
                    {getCollegeName(item.classId._id)}
                  </Text>
                  <Text className="text-xs text-center px-1" style={{ color: colors.textSecondary, width: 120 }}>
                    {item.department}
                  </Text>
                  <Text className="text-xs text-center px-1" style={{ color: colors.textSecondary, width: 120 }}>
                    {item.classId.className}
                  </Text>
                  <Text className="text-xs text-center px-1" style={{ color: colors.textSecondary, width: 130 }}>
                    {item.attendanceMarkedAt
                      ? new Date(item.attendanceMarkedAt).toLocaleDateString()
                      : "N/A"}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
}