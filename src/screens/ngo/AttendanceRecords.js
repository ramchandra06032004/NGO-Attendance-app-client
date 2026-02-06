import React, { useState, useEffect, useContext, Platform } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform as RNPlatform,
  ScrollView,
} from "react-native";

import { ngo_host } from "../../../apis/api";
import { useTheme } from "../../context/ThemeContext";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
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

      const r8 = worksheet.getCell("A8");
      r8.value = `Date: ${new Date(attendanceData.event?.eventDate).toLocaleDateString()}`;
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

      // 5. Add Data Rows
      attendanceData.attendance.forEach((student, index) => {
        const collegeName =
          attendanceData.colleges?.find((col) =>
            col.classes.includes(student.classId._id)
          )?.name || "";

        const row = worksheet.addRow([
          student.name || "",
          collegeName,
          student.department || "",
          student.classId?.className || "",
          student.attendanceMarkedAt
            ? new Date(student.attendanceMarkedAt).toLocaleDateString()
            : "N/A",
        ]);

        // Alternating Row Colors
        const bgColor = index % 2 === 0 ? "FFFFFFFF" : "FFF2F2F2";
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: bgColor },
          };
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
        // Mobile (Android/iOS)
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        const base64 = Buffer.from(buffer).toString("base64");

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Attendance",
          UTI: "com.microsoft.excel.xlsx",
        });
      }
    } catch (error) {
      console.error("Export Error:", error);
      alert("Failed to export: " + error.message);
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