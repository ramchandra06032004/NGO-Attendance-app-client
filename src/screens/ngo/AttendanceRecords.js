import React, { useState, useEffect, useContext, Platform } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform as RNPlatform,
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

// AttendanceRecords.js

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
        ["Student Name", "College", "Department", "Class"],
        ...attendanceData.attendance.map((student) => [
          student.name || "",
          getCollegeName(student.classId._id) || "",
          student.department || "",
          student.classId?.className || "",
        ]),
      ]);

      // Set column widths
      ws["!cols"] = [
        { wch: 25 },
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
      ];

      // Set row heights
      ws["!rows"] = [
        { hpx: 15 },   // Row 1: Empty
        { hpx: 32 },   // Row 2: NGO Name
        { hpx: 24 },   // Row 3: Address
        { hpx: 10 },   // Row 4: Empty
        { hpx: 28 },   // Row 5: EVENT DETAILS
        { hpx: 24 },   // Row 6: Event
        { hpx: 22 },   // Row 7: Location
        { hpx: 22 },   // Row 8: Date
        { hpx: 22 },   // Row 9: Total
        { hpx: 10 },   // Row 10: Empty
        { hpx: 28 },   // Row 11: Table Header
      ];

      if (!ws["!merges"]) ws["!merges"] = [];

      // Merge and style rows
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

      // Row 2 - NGO Name
      styleCell("A2", { bold: true, size: 18, color: "1F1F1F", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } });

      // Row 3 - NGO Address
      styleCell("A3", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 3 } });

      // Row 5 - EVENT DETAILS
      styleCell("A5", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      ws["!merges"].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 3 } });

      // Row 6 - Event Name
      styleCell("A6", { bold: true, size: 14, color: "1F1F1F", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 5, c: 0 }, e: { r: 5, c: 3 } });

      // Row 7 - Location
      styleCell("A7", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 6, c: 0 }, e: { r: 6, c: 3 } });

      // Row 8 - Date
      styleCell("A8", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 7, c: 0 }, e: { r: 7, c: 3 } });

      // Row 9 - Total Students
      styleCell("A9", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 8, c: 0 }, e: { r: 8, c: 3 } });

      // Row 11 - Table Headers
      styleCell("A11", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("B11", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("C11", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("D11", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });

      // Style data rows
      attendanceData.attendance.forEach((row, idx) => {
        const rowNum = 12 + idx;
        const bgColor = idx % 2 === 0 ? "FFFFFF" : "F2F2F2";
        
        styleCell(`A${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`B${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`C${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`D${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
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
        style={[
          styles.center,
          {
            backgroundColor: colors.backgroundColors
              ? colors.backgroundColors[0]
              : styles.center.backgroundColor,
          },
        ]}
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
        style={[
          styles.center,
          {
            backgroundColor: colors.backgroundColors
              ? colors.backgroundColors[0]
              : styles.center.backgroundColor,
          },
        ]}
      >
        <Text style={[styles.error, { color: colors.textPrimary }]}>
          Error: {error}
        </Text>
      </View>
    );
  }

  const renderAttendanceRow = ({ item }) => (
    <View
      style={[
        styles.tableRow,
        { backgroundColor: colors.cardBg, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.tableCell,
          styles.studentNameCell,
          { color: colors.textPrimary },
        ]}
      >
        {item.name}
      </Text>
      <Text
        style={[
          styles.tableCell,
          styles.collegeCell,
          { color: colors.textPrimary },
        ]}
      >
        {getCollegeName(item.classId._id)}
      </Text>
      <Text
        style={[
          styles.tableCell,
          styles.departmentCell,
          { color: colors.textSecondary },
        ]}
      >
        {item.department}
      </Text>
      <Text
        style={[
          styles.tableCell,
          styles.classNameCell,
          { color: colors.textSecondary },
        ]}
      >
        {item.classId.className}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColors
            ? colors.backgroundColors[0]
            : styles.container.backgroundColor,
        },
      ]}
    >
      {/* Header with Back and Export buttons */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => goBack()}
          style={[
            styles.smallBack,
            { borderColor: colors.border, backgroundColor: colors.cardBg },
          ]}
        >
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>

        {attendanceData.attendance && attendanceData.attendance.length > 0 && (
          <TouchableOpacity
            onPress={exportToExcel}
            style={[
              styles.exportBtn,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Export to Excel sheet</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.title, { color: colors.header }]}>
        Attendance Records for {attendanceData.event?.aim || "Event"}
      </Text>
      <Text style={[styles.eventDetails, { color: colors.textSecondary }]}>
        📍 Location: {attendanceData.event?.location}
      </Text>
      <Text style={[styles.eventDetails, { color: colors.textSecondary }]}>
        📅 Date:{" "}
        {new Date(attendanceData.event?.eventDate).toLocaleDateString()}
      </Text>
      <Text style={[styles.totalPresent, { color: colors.textPrimary }]}>
        Total Students Present: {attendanceData.totalStudentsPresent}
      </Text>
      {!attendanceData.attendance || attendanceData.attendance.length === 0 ? (
        <Text style={[styles.noRecords, { color: colors.textSecondary }]}>
          No attendance records found.
        </Text>
      ) : (
        <>
          {/* Table Header */}
          <View
            style={[styles.tableHeader, { backgroundColor: colors.headerBg }]}
          >
            <Text
              style={[
                styles.tableHeaderCell,
                styles.studentNameCell,
                { color: colors.headerText },
              ]}
            >
              Student
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.collegeCell,
                { color: colors.headerText },
              ]}
            >
              College
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.departmentCell,
                { color: colors.headerText },
              ]}
            >
              Department
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.classNameCell,
                { color: colors.headerText },
              ]}
            >
              Class
            </Text>
          </View>

          {/* Table Data */}
          <FlatList
            data={attendanceData.attendance}
            keyExtractor={(item) => item._id}
            renderItem={renderAttendanceRow}
            style={styles.tableList}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  smallBack: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  exportBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  eventDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalPresent: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
  },
  tableList: {},
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderColor: "#ccc",
    marginBottom: 5,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeaderCell: {
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  studentNameCell: {
    flex: 3,
  },
  collegeCell: {
    flex: 3,
  },
  departmentCell: {
    flex: 2,
  },
  classNameCell: {
    flex: 2,
  },
  noRecords: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  error: {
    color: "red",
  },
});
