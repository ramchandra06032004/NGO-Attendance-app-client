import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Platform as RNPlatform, ActivityIndicator, FlatList, Image } from 'react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ExcelJS from 'exceljs';
import { Buffer } from 'buffer';
import { NavigationContext } from '../../context/NavigationContext';
import { AttendanceContext } from '../../context/AttendanceContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from "../../context/AuthContext";
import { college_host } from "../../../apis/api";

// And ensure FileSystem/Sharing are required for mobile (as in your previous code)
// Platform-specific imports
let RealFileSystem, RealSharing;
if (RNPlatform.OS !== "web") {
  RealFileSystem = require("expo-file-system/legacy");
  RealSharing = require("expo-sharing");
}

export default function CollegeClassesScreen({ college }) {
  const { route, navigate, goBack } = useContext(NavigationContext);
  const { addClass } = useContext(AttendanceContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const classes = college.classes || [];
  const [newClass, setNewClass] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout, accessToken } = useContext(AuthContext);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [eventAttendanceList, setEventAttendanceList] = useState([]);
  const [showAttendanceTable, setShowAttendanceTable] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);

  // Helper to determine status based on attendance mark and date
  const getEventStatus = (eventObj, attendanceDateStr) => {
    // 1. If marked present, it's "Present"
    if (attendanceDateStr && attendanceDateStr !== "N/A") return "Present";

    // 2. If not marked, check if date is past
    if (!eventObj || !eventObj.eventDate) return "Registered"; // Default fallback

    const eventDate = new Date(eventObj.eventDate);
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return eventDate < today ? "Absent" : "Registered";
  };

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

  useEffect(() => {
    // console.log("College data: ", college); // <--- COMMENT THIS OUT to fix the crash
    // Extract unique events from all classes and students
    const allEvents = new Map();

    college.classes?.forEach((cls) => {
      cls.students?.forEach((student) => {
        student.attendedEvents?.forEach((event) => {
          const eventId = event.eventId?._id;
          if (eventId && !allEvents.has(eventId)) {
            allEvents.set(eventId, {
              _id: eventId,
              aim: event.eventId?.aim || "Unknown Event",
              createdBy: event.eventId?.createdBy?.name || "Unknown NGO",
              location: event.eventId?.location || "N/A",
              eventDate: event.eventId?.eventDate,
            });
          }
        });
      });
    });

    setEventsList(Array.from(allEvents.values()));
  }, [college]);

  const handleLogout = async () => {
    await logout();
    navigate("Home");
  };

  const handleEventSelect = async (event) => {
    setSelectedEvent(event);
    setShowEventDropdown(false);
    setShowAttendanceTable(true);
    setEventAttendanceList([]);
    setEventLoading(true);

    try {
      // Fetch fresh data from the API — returns ALL registered students
      // (both those who marked attendance and those who didn't)
      const response = await fetch(
        `${college_host}/event/${event._id}/attendance`,
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

      if (!response.ok) throw new Error("Failed to fetch attendance");

      const data = await response.json();
      // data.data.attendance is an array of college objects, each with a students array
      const students = data?.data?.attendance?.[0]?.students || [];

      const attendanceList = students.map((student) => {
        const attDate = student.attendanceMarkedAt
          ? new Date(student.attendanceMarkedAt).toDateString()
          : "N/A";
        return {
          studentName: student.name,
          prn: student.prn,
          department: student.department || "N/A",
          className: student.className || "N/A",
          attendanceDate: attDate,
          status: getEventStatus(event, attDate),
        };
      });

      setEventAttendanceList(attendanceList);
    } catch (err) {
      console.error("Error fetching event attendance:", err);
      alert("Could not load attendance data: " + err.message);
    } finally {
      setEventLoading(false);
    }
  };

  const handleOutsideClick = () => {
    setShowAttendanceTable(false);
    setShowEventDropdown(false);
  };
  //Exports all events attendance data to excel file
  const exportAllEventsToExcel = async () => {
    console.log("Exporting all events to Excel...");

    try {
      if (!eventsList || eventsList.length === 0) {
        alert("No events to export");
        return;
      }

      setLoading(true);

      const workbook = new ExcelJS.Workbook();
      const collegeName = college.name?.toUpperCase() || "College";
      const collegeAddress = college.address || "Address not available";
      const logoUrl = college.logoUrl || college.profileImage; // Check both keys

      // --- 1. PRE-LOAD LOGO IMAGE (ONCE) ---
      let logoImageId = null;
      if (logoUrl) {
        try {
          let base64Data = "";
          let extension = "png";

          if (logoUrl.toLowerCase().includes("jpg") || logoUrl.toLowerCase().includes("jpeg")) {
            extension = "jpeg";
          }

          if (RNPlatform.OS === "web") {
            // 🌍 WEB
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            await new Promise((resolve) => {
              reader.onloadend = () => {
                base64Data = reader.result.toString().split(",")[1];
                resolve();
              };
            });
          } else {
            // 📱 MOBILE
            const fileUri = `${FileSystem.cacheDirectory}college_logo_temp.${extension}`;
            await FileSystem.downloadAsync(logoUrl, fileUri);
            base64Data = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }

          if (base64Data) {
            logoImageId = workbook.addImage({
              base64: base64Data,
              extension: extension,
            });
          }
        } catch (err) {
          console.warn("Could not load logo for export:", err);
        }
      }

      let hasData = false;

      // --- 2. ITERATE AND CREATE SHEET FOR EACH EVENT (via API) ---
      for (const event of eventsList) {
        // A. Fetch fresh attendance data from API
        let eventAttendance = [];
        try {
          const res = await fetch(
            `${college_host}/event/${event._id}/attendance`,
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
          if (res.ok) {
            const apiData = await res.json();
            const students = apiData?.data?.attendance?.[0]?.students || [];
            eventAttendance = students.map((student) => {
              const attDate = student.attendanceMarkedAt
                ? new Date(student.attendanceMarkedAt).toLocaleDateString()
                : "N/A";
              return {
                studentName: student.name,
                prn: student.prn,
                department: student.department || "N/A",
                className: student.className || "N/A",
                attendanceDate: attDate,
                status: getEventStatus(event, attDate),
              };
            });
          }
        } catch (err) {
          console.warn(`Could not fetch attendance for event ${event._id}:`, err);
        }

        // Skip events with no registered students
        if (eventAttendance.length === 0) continue;
        hasData = true;

        // B. Setup Worksheet
        const eventName = event.aim || "Event";
        const safeSheetName = (eventName.replace(/[\\/?*[\]]/g, "")).slice(0, 30);
        const worksheet = workbook.addWorksheet(safeSheetName);

        // C. Insert Logo
        if (logoImageId !== null) {
          worksheet.addImage(logoImageId, {
            tl: { col: 0, row: 0 }, // A1
            br: { col: 1, row: 4 }, // B5
            editAs: "oneCell",
          });
        } else {
          worksheet.getCell("A2").value = "No Logo";
        }

        // D. Header Information
        // College Name
        worksheet.mergeCells("B2:E2");
        const nameCell = worksheet.getCell("B2");
        nameCell.value = collegeName;
        nameCell.font = { bold: true, size: 18 };
        nameCell.alignment = { vertical: "middle", horizontal: "center" };

        // College Address
        worksheet.mergeCells("B3:E3");
        const addrCell = worksheet.getCell("B3");
        addrCell.value = collegeAddress;
        addrCell.font = { color: { argb: "FF666666" }, size: 12 };
        addrCell.alignment = { vertical: "top", horizontal: "center" };

        // E. Event Details Section
        worksheet.mergeCells("A6:E6");
        const titleRow = worksheet.getCell("A6");
        titleRow.value = "EVENT DETAILS";
        titleRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
        titleRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" }, // Blue
        };
        titleRow.alignment = { horizontal: "center", vertical: "middle" };

        // Helper to add centered info rows
        const addInfoRow = (label, value, rowIndex, isBold = false) => {
          const row = worksheet.getRow(rowIndex);
          row.values = [`${label}: ${value}`];
          worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
          const cell = row.getCell(1);
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { size: 12, bold: isBold };
          if (isBold) cell.font.size = 14;
        };

        addInfoRow("Event", eventName, 7, true);
        addInfoRow("NGO", event.createdBy?.name || event.createdBy || "N/A", 8);
        addInfoRow("Location", event.location || "N/A", 9);
        addInfoRow("Date", new Date(event.eventDate).toLocaleDateString(), 10);
        addInfoRow("Total Registered", eventAttendance.length, 11);
        addInfoRow("Total Present", eventAttendance.filter(r => r.status === "Present").length, 12);

        // F. Table Headers
        const headerRow = worksheet.getRow(14);
        headerRow.values = ["Student Name", "PRN", "Department", "Class", "Status", "Attendance Date"];
        headerRow.height = 25;

        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // G. Data Rows
        eventAttendance.forEach((record, idx) => {
          const row = worksheet.addRow([
            record.studentName,
            record.prn,
            record.department,
            record.className,
            record.status,
            record.attendanceDate,
          ]);

          // Zebra Striping
          const isEven = idx % 2 === 0;
          row.eachCell((cell, colNumber) => {
            // Status Column Color Logic (Col 5)
            if (colNumber === 5) {
              const s = record.status;
              const color = s === "Present" ? "FF10b981" : (s === "Absent" ? "FFef4444" : "FFf59e0b");
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
              cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
            } else {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: isEven ? "FFFFFFFF" : "FFF2F2F2" },
              };
            }
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });

        // Set Column Widths
        worksheet.columns = [
          { width: 25 }, // Name
          { width: 15 }, // PRN
          { width: 20 }, // Dept
          { width: 20 }, // Class
          { width: 15 }, // Status
          { width: 20 }, // Date
        ];
      } // end for...of eventsList

      if (!hasData) {
        setLoading(false);
        alert("No attendance data found in any event.");
        return;
      }

      // --- 3. WRITE & SAVE ---
      const filename = `all_events_${college.name?.replace(/\s+/g, "_")}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();

      if (RNPlatform.OS === "web") {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        window.URL.revokeObjectURL(url);
        alert("Export successful!");
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
            encoding: RealFileSystem.EncodingType.Base64
          });
          await RealSharing.shareAsync(fileUri, {
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            dialogTitle: "Export All Events",
            UTI: "com.microsoft.excel.xlsx",
          });
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error exporting to Excel:", error);
      alert("Failed to export: " + error.message);
    }
  };
  //Exports specific event attendance data to excel file
  const exportEventAttendanceToExcel = async () => {
    try {
      if (!selectedEvent || eventAttendanceList.length === 0) {
        alert("No attendance records to export");
        return;
      }

      setLoading(true);

      const workbook = new ExcelJS.Workbook();
      const collegeName = college.name?.toUpperCase() || "College";
      const collegeAddress = college.address || "Address not available";
      const logoUrl = college.logoUrl || college.profileImage; // Check both keys

      // --- 1. PRE-LOAD LOGO IMAGE ---
      let logoImageId = null;
      if (logoUrl) {
        try {
          let base64Data = "";
          let extension = "png";

          if (logoUrl.toLowerCase().includes("jpg") || logoUrl.toLowerCase().includes("jpeg")) {
            extension = "jpeg";
          }

          if (RNPlatform.OS === "web") {
            // 🌍 WEB
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            await new Promise((resolve) => {
              reader.onloadend = () => {
                base64Data = reader.result.toString().split(",")[1];
                resolve();
              };
            });
          } else {
            // 📱 MOBILE
            const fileUri = `${FileSystem.cacheDirectory}college_logo_temp.${extension}`;
            await FileSystem.downloadAsync(logoUrl, fileUri);
            base64Data = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }

          if (base64Data) {
            logoImageId = workbook.addImage({
              base64: base64Data,
              extension: extension,
            });
          }
        } catch (err) {
          console.warn("Could not load logo:", err);
        }
      }

      // --- 2. CREATE SHEET ---
      const eventName = selectedEvent.aim || "Event";
      const safeSheetName = (eventName.replace(/[\\/?*[\]]/g, "")).slice(0, 30);
      const worksheet = workbook.addWorksheet(safeSheetName);

      // --- A. INSERT IMAGE ---
      if (logoImageId !== null) {
        worksheet.addImage(logoImageId, {
          tl: { col: 0, row: 0 }, // A1
          br: { col: 1, row: 4 }, // B5 (Covers A1:A4 approx)
          editAs: "oneCell",
        });
      } else {
        worksheet.getCell("A2").value = "No Logo";
      }

      // --- B. HEADER INFORMATION ---
      // College Name (Merged B2:E2)
      worksheet.mergeCells("B2:E2");
      const nameCell = worksheet.getCell("B2");
      nameCell.value = collegeName;
      nameCell.font = { bold: true, size: 18 };
      nameCell.alignment = { vertical: "middle", horizontal: "center" };

      // College Address (Merged B3:E3)
      worksheet.mergeCells("B3:E3");
      const addrCell = worksheet.getCell("B3");
      addrCell.value = collegeAddress;
      addrCell.font = { color: { argb: "FF666666" }, size: 12 };
      addrCell.alignment = { vertical: "top", horizontal: "center" };

      // EVENT DETAILS Header (Merged A6:E6)
      worksheet.mergeCells("A6:E6");
      const titleRow = worksheet.getCell("A6");
      titleRow.value = "EVENT DETAILS";
      titleRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      titleRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" }, // Blue
      };
      titleRow.alignment = { horizontal: "center", vertical: "middle" };

      // Event Metadata Rows (Centered)
      const addInfoRow = (label, value, rowIndex, isBold = false) => {
        const row = worksheet.getRow(rowIndex);
        row.values = [`${label}: ${value}`];
        worksheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
        const cell = row.getCell(1);
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = { size: 12, bold: isBold };
        if (isBold) cell.font.size = 14;
      };

      addInfoRow("Event", eventName, 7, true);
      addInfoRow("NGO", selectedEvent.createdBy?.name || selectedEvent.createdBy || "N/A", 8);
      addInfoRow("Location", selectedEvent.location || "N/A", 9);
      addInfoRow("Date", new Date(selectedEvent.eventDate).toLocaleDateString(), 10);
      addInfoRow("Total Registered", eventAttendanceList.length, 11);
      addInfoRow("Total Present", eventAttendanceList.filter(r => r.status === "Present").length, 12);

      // --- C. TABLE HEADERS (Row 14) ---
      const headerRow = worksheet.getRow(14);
      headerRow.values = ["Student Name", "PRN", "Department", "Class", "Status", "Attendance Date"];

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" }, // Blue
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      headerRow.height = 25;

      // --- D. DATA ROWS ---
      eventAttendanceList.forEach((record, idx) => {
        const row = worksheet.addRow([
          record.studentName || record.name || "",
          record.prn || "",
          record.department || "",
          record.className || record.classId?.className || "",
          record.status || "Registered",
          record.attendanceDate || new Date().toLocaleDateString(),
        ]);

        // Alternating Row Colors
        const isEven = idx % 2 === 0;
        row.eachCell((cell, colNumber) => {
          if (colNumber === 5) {
            // Status Color
            const s = record.status || "Registered";
            const color = s === "Present" ? "FF10b981" : (s === "Absent" ? "FFef4444" : "FFf59e0b");
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
            cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          } else {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: isEven ? "FFFFFFFF" : "FFF2F2F2" },
            };
          }
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Set Column Widths
      worksheet.columns = [
        { width: 25 }, // Name
        { width: 15 }, // PRN
        { width: 20 }, // Dept
        { width: 20 }, // Class
        { width: 15 }, // Status
        { width: 20 }, // Date
      ];

      // --- 3. WRITE & SAVE FILE ---
      const filename = `event_attendance_${selectedEvent.aim?.replace(/\s+/g, "_")}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();

      if (RNPlatform.OS === "web") {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        window.URL.revokeObjectURL(url);
        alert("Event attendance exported successfully!");
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
            encoding: RealFileSystem.EncodingType.Base64
          });
          await RealSharing.shareAsync(fileUri, {
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            dialogTitle: "Export Event Attendance",
            UTI: "com.microsoft.excel.xlsx",
          });
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error exporting to Excel:", error);
      alert("Failed to export event attendance: " + error.message);
    }
  };

  const fetchStudentsByClass = async () => {
    try {
      const allStudents = [];

      for (const cls of classes) {
        const response = await fetch(`${college_host}/class/${cls._id}/students`, {
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
          allStudents.push({
            className: cls.className,
            students: data.data || [],
          });
        }
      }

      return allStudents;
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  };
  //Exports class-wise attendance data to excel file
  const exportToExcel = async () => {
    try {
      setLoading(true);

      const workbook = new ExcelJS.Workbook();
      const collegeName = college.name.toUpperCase() || "College";
      const collegeAddress = college.address || "Address not available";
      const logoUrl = college.logoUrl;

      // --- 1. PRE-LOAD LOGO IMAGE ---
      let logoImageId = null;
      if (logoUrl) {
        try {
          let base64Data = "";
          let extension = "png";
          if (
            logoUrl.toLowerCase().includes("jpg") ||
            logoUrl.toLowerCase().includes("jpeg")
          ) {
            extension = "jpeg";
          }

          if (RNPlatform.OS === "web") {
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            await new Promise((resolve) => {
              reader.onloadend = () => {
                base64Data = reader.result.toString().split(",")[1];
                resolve();
              };
            });
          } else {
            const fileUri = `${FileSystem.cacheDirectory}college_logo_temp.${extension}`;
            await FileSystem.downloadAsync(logoUrl, fileUri);
            base64Data = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }

          if (base64Data) {
            logoImageId = workbook.addImage({
              base64: base64Data,
              extension: extension,
            });
          }
        } catch (err) {
          console.warn("Could not load college logo:", err);
        }
      }

      // --- 2. CREATE SHEETS PER CLASS ---
      college.classes.forEach((classData) => {
        if (!classData.students || classData.students.length === 0) return;

        const safeSheetName = (classData.className || "Class")
          .replace(/[\\/?*[\]]/g, " ")
          .substring(0, 30);
        const worksheet = workbook.addWorksheet(safeSheetName);

        // --- A. INSERT IMAGE ---
        if (logoImageId !== null) {
          worksheet.addImage(logoImageId, {
            tl: { col: 0, row: 0 },
            br: { col: 1, row: 4 },
            editAs: "oneCell",
          });
        } else {
          worksheet.getCell("A2").value = "No Logo";
        }

        // --- B. HEADER INFORMATION ---
        worksheet.mergeCells("B2:G2");
        const nameCell = worksheet.getCell("B2");
        nameCell.value = collegeName;
        nameCell.font = { bold: true, size: 18 };
        nameCell.alignment = { vertical: "middle" };

        worksheet.mergeCells("B3:G3");
        const addrCell = worksheet.getCell("B3");
        addrCell.value = collegeAddress;
        addrCell.font = { color: { argb: "FF666666" }, size: 12 };
        addrCell.alignment = { vertical: "top" };

        worksheet.mergeCells("A5:G5");
        const classHeader = worksheet.getCell("A5");
        classHeader.value = `CLASS: ${classData.className}`;
        classHeader.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        classHeader.font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
          size: 14,
        };
        classHeader.alignment = { horizontal: "center", vertical: "middle" };

        // --- C. TABLE HEADERS ---
        const headerRow = worksheet.getRow(7);
        headerRow.values = [
          "Student Name",
          "PRN",
          "Department",
          "Event Name",
          "NGO Name",
          "Status",
          "Event Date",
          "Attendance Date",
        ];

        headerRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
          };
          cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        headerRow.height = 25;

        // --- D. DATA ROWS WITH MERGING ---
        let currentRowIndex = 8; // Start after header

        classData.students.forEach((student) => {
          const events = student.attendedEvents || [];
          const rowCount = events.length > 0 ? events.length : 1;
          const startRow = currentRowIndex;
          const endRow = currentRowIndex + rowCount - 1;

          if (events.length > 0) {
            events.forEach((event, idx) => {
              const eventName = event?.eventId?.aim || "N/A";
              const ngoName = event?.eventId?.createdBy?.name || "N/A";
              const eventDate = event?.eventId?.eventDate
                ? new Date(event.eventId.eventDate).toLocaleDateString()
                : "N/A";
              const attendanceDateStr = event?.attendanceMarkedAt
                ? new Date(event.attendanceMarkedAt).toLocaleDateString()
                : "N/A";

              const status = getEventStatus(event?.eventId, attendanceDateStr);

              const row = worksheet.getRow(currentRowIndex + idx);
              row.values = [
                student.name,
                student.prn,
                student.department,
                eventName,
                ngoName,
                status,
                eventDate,
                attendanceDateStr,
              ];

              // Color Logic for Status (Col 6)
              row.eachCell((cell, colNumber) => {
                if (colNumber === 6) {
                  const color = status === "Present" ? "FF10b981" : (status === "Absent" ? "FFef4444" : "FFf59e0b");
                  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
                  cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
                }
                // Borders will be applied in the student loop below, but we can set alignment here if needed
              });
            });
          } else {
            // No events
            const row = worksheet.getRow(currentRowIndex);
            row.values = [
              student.name || "",
              student.prn || "N/A",
              student.department || "",
              "No events attended",
              "-",
              "-", // Status
              "-",
              "-",
            ];
          }

          // --- APPLY MERGING ---
          // Merge Name, PRN, Dept columns (A, B, C) vertically for this student
          if (rowCount > 1) {
            worksheet.mergeCells(`A${startRow}:A${endRow}`);
            worksheet.mergeCells(`B${startRow}:B${endRow}`);
            worksheet.mergeCells(`C${startRow}:C${endRow}`);
          }

          // --- APPLY STYLING TO ALL ROWS FOR THIS STUDENT ---
          for (let r = startRow; r <= endRow; r++) {
            const row = worksheet.getRow(r);
            // Alternate colors based on STUDENT groups (not just individual rows)
            // Using startRow ensures the whole block is the same color
            const isEvenBlock = startRow % 2 === 0;
            const bgColor = isEvenBlock ? "FFFFFFFF" : "FFF2F2F2";

            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: bgColor },
              };
              cell.alignment = {
                horizontal: "center",
                vertical: "middle", // Important for merged cells
                wrapText: true,
              };
              cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
              };
            });
          }

          // Advance the row index
          currentRowIndex += rowCount;
        });

        // Set Column Widths
        worksheet.columns = [
          { width: 25 }, // Name
          { width: 15 }, // PRN
          { width: 20 }, // Dept
          { width: 30 }, // Event
          { width: 20 }, // NGO
          { width: 15 }, // Date
          { width: 15 }, // Date
        ];
      });

      // --- 3. WRITE & SAVE FILE ---
      const filename = `college_data_${college.name?.replace(
        /\s+/g,
        "_"
      )}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();

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
        alert("College data exported successfully!");
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
            dialogTitle: "Export College Data",
            UTI: "com.microsoft.excel.xlsx",
          });
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Export Error:", error);
      setLoading(false);
      alert("Failed to export: " + error.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text className="text-base mt-2.5" style={{ color: colors.textPrimary }}>Exporting data...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleOutsideClick}
      className="flex-1"
      style={{
        backgroundColor: colors.backgroundColors
          ? colors.backgroundColors[0]
          : "#F8F9FA", // Very light grey professional background
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
      >
        {/* --- 1. PROFESSIONAL HEADER --- */}
        <View className="mb-4 p-4 rounded-xl border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
          <View className="flex-row items-center justify-between gap-1">
            {/* Left: Logo + College Info */}
            <View className="flex-row items-center flex-1 gap-3">
              {/* Logo Box */}
              <View
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: colors.iconBg,
                  borderColor: colors.border,
                  width: 70,
                  height: 70,
                  flexShrink: 0,
                }}
              >
                {college.logoUrl ? (
                  <Image
                    source={{ uri: college.logoUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.accent }}>
                    <Text className="text-white font-bold text-2xl">
                      {college.name?.[0]?.toUpperCase() || "C"}
                    </Text>
                  </View>
                )}
              </View>

              {/* College Name & Address - Full width, wrapping text */}
              <View className="flex-1">
                <Text
                  className="font-bold text-base leading-5"
                  style={{ color: colors.header }}
                >
                  {college.name.toUpperCase()}
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  {college.address}
                </Text>
              </View>
            </View>

            {/* Right: Small Logout Button */}
            <TouchableOpacity
              className="px-3 py-1.5 rounded-full border ml-1"
              style={{ borderColor: colors.error || "#ef4444", borderWidth: 1 }}
              onPress={handleLogout}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: colors.error || "#ef4444" }}
              >
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* --- 2. DATA EXPORT ACTIONS --- */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 py-3.5 px-2 rounded-lg items-center justify-center border"
            style={{
              backgroundColor: colors.accent,
              borderColor: colors.accent
            }}
            onPress={exportToExcel}
          >
            <Text className="text-white font-semibold text-xs text-center uppercase tracking-wide">
              Export Class Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 py-3.5 px-2 rounded-lg items-center justify-center border"
            style={{
              backgroundColor: "transparent",
              borderColor: colors.accent,
              borderWidth: 1
            }}
            onPress={exportAllEventsToExcel}
          >
            <Text
              className="font-semibold text-xs text-center uppercase tracking-wide"
              style={{ color: colors.accent }}
            >
              Export All Events
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- 3. EVENT ANALYTICS --- */}
        <View
          className="rounded-xl border mb-6 overflow-hidden"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <View className="p-4 border-b" style={{ borderColor: colors.border }}>
            <Text
              className="text-base font-bold"
              style={{ color: colors.header }}
            >
              Event Attendance
            </Text>
          </View>

          <View className="p-4">
            {/* Dropdown Selector */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowEventDropdown(!showEventDropdown)}
              className="flex-row justify-between items-center p-3 rounded-lg border mb-4"
              style={{
                backgroundColor: colors.iconBg,
                borderColor: showEventDropdown ? colors.accent : colors.border,
              }}
            >
              <Text
                style={{
                  color: selectedEvent ? colors.textPrimary : colors.textSecondary,
                  fontWeight: selectedEvent ? "600" : "400",
                }}
              >
                {selectedEvent ? selectedEvent.aim : "Select an Event"}
              </Text>
              {/* Simple geometric text chevron */}
              <Text style={{ color: colors.textSecondary, fontSize: 10 }}>▼</Text>
            </TouchableOpacity>

            {/* Dropdown Options */}
            {showEventDropdown && (
              <View
                className="border rounded-lg mb-4 overflow-hidden"
                style={{ borderColor: colors.border, maxHeight: 200 }}
              >
                <ScrollView nestedScrollEnabled>
                  {eventsList.map((event, idx) => (
                    <TouchableOpacity
                      key={event._id}
                      className={`p-3 ${idx !== eventsList.length - 1 ? "border-b" : ""}`}
                      style={{
                        borderColor: colors.border,
                        backgroundColor:
                          selectedEvent?._id === event._id
                            ? colors.iconBg
                            : colors.cardBg,
                      }}
                      onPress={() => handleEventSelect(event)}
                    >
                      <Text
                        className="font-medium text-sm"
                        style={{ color: colors.textPrimary }}
                      >
                        {event.aim}
                      </Text>
                      <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        {new Date(event.eventDate).toDateString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Selected Event Data */}
            {showAttendanceTable && selectedEvent && (
              <View>
                {eventLoading ? (
                  <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>Loading attendance...</Text>
                  </View>
                ) : (
                  <>
                    <View className="flex-row justify-between items-end mb-3">
                      <View className="flex-row gap-4">
                        <View>
                          <Text className="text-[10px] uppercase font-bold" style={{ color: '#10b981' }}>Present</Text>
                          <Text className="text-2xl font-light" style={{ color: '#10b981' }}>
                            {eventAttendanceList.filter(r => r.status === "Present").length}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-[10px] uppercase font-bold" style={{ color: '#ef4444' }}>Absent</Text>
                          <Text className="text-2xl font-light" style={{ color: '#ef4444' }}>
                            {eventAttendanceList.filter(r => r.status === "Absent").length}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-[10px] uppercase font-bold" style={{ color: '#f59e0b' }}>Registered</Text>
                          <Text className="text-2xl font-light" style={{ color: '#f59e0b' }}>
                            {eventAttendanceList.filter(r => r.status === "Registered").length}
                          </Text>
                        </View>
                      </View>
                      {eventAttendanceList.length > 0 && (
                        <TouchableOpacity onPress={exportEventAttendanceToExcel}>
                          <Text className="text-xs font-bold underline" style={{ color: colors.accent }}>
                            Download Report
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {eventAttendanceList.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="border rounded-lg"
                        style={{ borderColor: colors.border }}
                      >
                        <View>
                          {/* Grid Header */}
                          <View
                            className="flex-row py-2 px-2 border-b"
                            style={{ backgroundColor: "#F3F4F6", borderColor: colors.border }}
                          >
                            <Text className="w-32 text-xs font-bold text-gray-500 uppercase">Student Name</Text>
                            <Text className="w-24 text-xs font-bold text-gray-500 uppercase text-center">PRN</Text>
                            <Text className="w-24 text-xs font-bold text-gray-500 uppercase text-center">Class</Text>
                            <Text className="w-24 text-xs font-bold text-gray-500 uppercase text-center">Status</Text>
                            <Text className="w-28 text-xs font-bold text-gray-500 uppercase text-right">Date</Text>
                          </View>
                          {/* Grid Rows */}
                          {eventAttendanceList.map((record, index) => (
                            <View
                              key={index}
                              className="flex-row py-3 px-2 border-b last:border-0"
                              style={{
                                borderColor: colors.border,
                                backgroundColor: colors.cardBg
                              }}
                            >
                              <Text className="w-32 text-xs font-medium" style={{ color: colors.textPrimary }} numberOfLines={1}>
                                {record.studentName}
                              </Text>
                              <Text className="w-24 text-xs text-center" style={{ color: colors.textSecondary }}>
                                {record.prn}
                              </Text>
                              <Text className="w-24 text-xs text-center" style={{ color: colors.textSecondary }}>
                                {record.className}
                              </Text>
                              <View className="w-24 items-center justify-center">
                                <Text className="text-[10px] font-bold px-2 py-0.5 rounded text-white overflow-hidden"
                                  style={{
                                    backgroundColor: record.status === "Present" ? "#10b981" : (record.status === "Absent" ? "#ef4444" : "#f59e0b")
                                  }}>
                                  {record.status}
                                </Text>
                              </View>
                              <Text className="w-28 text-xs text-right" style={{ color: colors.textSecondary }}>
                                {record.attendanceDate}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    ) : (
                      <Text className="text-center py-4 text-xs italic" style={{ color: colors.textSecondary }}>
                        No students registered for this event.
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        {/* --- 4. CLASS MANAGEMENT --- */}
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <Text
              className="text-base font-bold"
              style={{ color: colors.header }}
            >
              Classes
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {classes.map((c) => (
              <TouchableOpacity
                key={c._id || c.className}
                className="py-4 px-3 rounded-lg border mb-3 w-[48%]"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.cardBg,
                }}
                onPress={() =>
                  navigate("ClassStudents", { college, className: c.className })
                }
              >
                <Text
                  className="font-medium text-sm text-center"
                  style={{ color: colors.textPrimary }}
                >
                  {c.className}
                </Text>
              </TouchableOpacity>
            ))}

            {/* "Add New" Button - Dashed Style */}
            <TouchableOpacity
              className="py-4 px-3 rounded-lg border border-dashed mb-3 w-[48%] justify-center items-center"
              style={{
                borderColor: colors.accent,
                backgroundColor: "transparent",
              }}
              onPress={() => navigate("AddClass", { college })}
            >
              <Text
                className="font-bold text-sm"
                style={{ color: colors.accent }}
              >
                + Add New Class
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </TouchableOpacity>
  );
}