import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform as RNPlatform, ActivityIndicator, FlatList } from 'react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { NavigationContext } from '../../context/NavigationContext';
import { AttendanceContext } from '../../context/AttendanceContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from "../../context/AuthContext";
import { college_host } from "../../../apis/api";

// Platform-specific imports
let RealFileSystem, RealSharing;
if (RNPlatform.OS !== "web") {
  RealFileSystem = require("expo-file-system");
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
  const { logout } = useContext(AuthContext);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [eventAttendanceList, setEventAttendanceList] = useState([]);
  const [showAttendanceTable, setShowAttendanceTable] = useState(false);

  useEffect(() => {
    console.log("College data: ", college);
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

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setShowEventDropdown(false);
    setShowAttendanceTable(true);
    
    // Get all students who attended this event
    const attendanceList = [];
    
    college.classes?.forEach((cls) => {
      cls.students?.forEach((student) => {
        const attended = student.attendedEvents?.find(
          (att) => att.eventId?._id === event._id
        );
        
        if (attended) {
          attendanceList.push({
            studentName: student.name,
            prn: student.prn,
            department: student.department,
            className: cls.className,
            attendanceDate: attended.attendanceMarkedAt
              ? new Date(attended.attendanceMarkedAt).toDateString()
              : "N/A",
          });
        }
      });
    });
    
    setEventAttendanceList(attendanceList);
  };

  const handleOutsideClick = () => {
    setShowAttendanceTable(false);
    setShowEventDropdown(false);
  };

  const exportAllEventsToExcel = async () => {
    try {
      if (eventsList.length === 0) {
        alert("No events to export");
        return;
      }

      setLoading(true);

      const wb = XLSX.utils.book_new();
      const collegeName = college.name || "College";
      const collegeAddress = college.address || "Address not available";

      // Create a sheet for each event
      eventsList.forEach((event) => {
        // Get all students who attended this event
        const eventAttendance = [];
        
        college.classes?.forEach((cls) => {
          cls.students?.forEach((student) => {
            const attended = student.attendedEvents?.find(
              (att) => att.eventId?._id === event._id
            );
            
            if (attended) {
              eventAttendance.push({
                studentName: student.name,
                prn: student.prn,
                department: student.department,
                className: cls.className,
                attendanceDate: attended.attendanceMarkedAt
                  ? new Date(attended.attendanceMarkedAt).toDateString()
                  : "N/A",
              });
            }
          });
        });

        if (eventAttendance.length === 0) {
          return; // Skip events with no attendance
        }

        const eventName = event.aim || "N/A";
        const eventLocation = event.location || "N/A";
        const eventDate = new Date(event.eventDate).toLocaleDateString() || "N/A";
        const ngoName = event.createdBy || "N/A";
        const totalPresent = eventAttendance.length;

        // Create worksheet with data
        const sheetData = [
          [],
          [collegeName],
          [collegeAddress],
          [],
          ["EVENT DETAILS"],
          [`Event: ${eventName}`],
          [`NGO: ${ngoName}`],
          [`Location: ${eventLocation}`],
          [`Date: ${eventDate}`],
          [`Total Students Present: ${totalPresent}`],
          [],
          ["Student Name", "PRN", "Department", "Class", "Attendance Date"],
          ...eventAttendance.map((record) => [
            record.studentName || "",
            record.prn || "",
            record.department || "",
            record.className || "",
            record.attendanceDate || "N/A",
          ]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // Set column widths
        ws["!cols"] = [
          { wch: 25 },
          { wch: 15 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
        ];

        // Set row heights
        ws["!rows"] = [
          { hpx: 15 },   // Row 1: Empty
          { hpx: 32 },   // Row 2: College Name
          { hpx: 24 },   // Row 3: Address
          { hpx: 10 },   // Row 4: Empty
          { hpx: 28 },   // Row 5: EVENT DETAILS
          { hpx: 24 },   // Row 6: Event
          { hpx: 24 },   // Row 7: NGO
          { hpx: 22 },   // Row 8: Location
          { hpx: 22 },   // Row 9: Date
          { hpx: 22 },   // Row 10: Total
          { hpx: 10 },   // Row 11: Empty
          { hpx: 28 },   // Row 12: Table Header
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

        // Row 2 - College Name
        styleCell("A2", { bold: true, size: 18, color: "1F1F1F", bgColor: "FFFFFF", align: "center" });
        ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });

        // Row 3 - College Address
        styleCell("A3", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
        ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 4 } });

        // Row 5 - EVENT DETAILS
        styleCell("A5", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
        ws["!merges"].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 4 } });

        // Row 6 - Event Name
        styleCell("A6", { bold: true, size: 14, color: "1F1F1F", bgColor: "FFFFFF", align: "center" });
        ws["!merges"].push({ s: { r: 5, c: 0 }, e: { r: 5, c: 4 } });

        // Row 7 - NGO Name
        styleCell("A7", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
        ws["!merges"].push({ s: { r: 6, c: 0 }, e: { r: 6, c: 4 } });

        // Row 8 - Location
        styleCell("A8", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
        ws["!merges"].push({ s: { r: 7, c: 0 }, e: { r: 7, c: 4 } });

        // Row 9 - Date
        styleCell("A9", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
        ws["!merges"].push({ s: { r: 8, c: 0 }, e: { r: 8, c: 4 } });

        // Row 10 - Total Students
        styleCell("A10", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
        ws["!merges"].push({ s: { r: 9, c: 0 }, e: { r: 9, c: 4 } });

        // Row 12 - Table Headers
        styleCell("A12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
        styleCell("B12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
        styleCell("C12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
        styleCell("D12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
        styleCell("E12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });

        // Style data rows
        eventAttendance.forEach((row, idx) => {
          const rowNum = 13 + idx;
          const bgColor = idx % 2 === 0 ? "FFFFFF" : "F2F2F2";
          
          styleCell(`A${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
          styleCell(`B${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
          styleCell(`C${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
          styleCell(`D${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
          styleCell(`E${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        });

        // Add sheet to workbook with event name as sheet title (max 31 chars)
        const sheetName = eventName.slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const filename = `all_events_${college.name?.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`;

      if (RNPlatform.OS === "web") {
        XLSX.writeFile(wb, filename);
        alert("All events exported successfully!");
      } else {
        const wbout = XLSX.write(wb, {
          type: "base64",
          bookType: "xlsx",
        });

        const filepath = `${RealFileSystem.documentDirectory}${filename}`;

        await RealFileSystem.writeAsStringAsync(filepath, wbout, {
          encoding: RealFileSystem.EncodingType.Base64,
        });

        await RealSharing.shareAsync(filepath, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export All Events",
          UTI: "com.microsoft.excel.xlsx",
        });

        alert("All events exported successfully!");
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error exporting to Excel:", error);
      alert("Failed to export all events: " + error.message);
    }
  };

  const exportEventAttendanceToExcel = async () => {
    try {
      if (!selectedEvent || eventAttendanceList.length === 0) {
        alert("No attendance records to export");
        return;
      }

      setLoading(true);

      const wb = XLSX.utils.book_new();
      const collegeName = college.name || "College";
      const collegeAddress = college.address || "Address not available";
      const eventName = selectedEvent.aim || "N/A";
      const eventLocation = selectedEvent.location || "N/A";
      const eventDate = new Date(selectedEvent.eventDate).toLocaleDateString() || "N/A";
      const ngoName = selectedEvent.createdBy || "N/A";
      const totalPresent = eventAttendanceList.length;

      // Create worksheet with data
      const sheetData = [
        [],
        [collegeName],
        [collegeAddress],
        [],
        ["EVENT DETAILS"],
        [`Event: ${eventName}`],
        [`NGO: ${ngoName}`],
        [`Location: ${eventLocation}`],
        [`Date: ${eventDate}`],
        [`Total Students Present: ${totalPresent}`],
        [],
        ["Student Name", "PRN", "Department", "Class", "Attendance Date"],
        ...eventAttendanceList.map((record) => [
          record.studentName || "",
          record.prn || "",
          record.department || "",
          record.className || "",
          record.attendanceDate || "N/A",
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Set column widths
      ws["!cols"] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
      ];

      // Set row heights
      ws["!rows"] = [
        { hpx: 15 },   // Row 1: Empty
        { hpx: 32 },   // Row 2: College Name
        { hpx: 24 },   // Row 3: Address
        { hpx: 10 },   // Row 4: Empty
        { hpx: 28 },   // Row 5: EVENT DETAILS
        { hpx: 24 },   // Row 6: Event
        { hpx: 24 },   // Row 7: NGO
        { hpx: 22 },   // Row 8: Location
        { hpx: 22 },   // Row 9: Date
        { hpx: 22 },   // Row 10: Total
        { hpx: 10 },   // Row 11: Empty
        { hpx: 28 },   // Row 12: Table Header
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

      // Row 2 - College Name
      styleCell("A2", { bold: true, size: 18, color: "1F1F1F", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });

      // Row 3 - College Address
      styleCell("A3", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 4 } });

      // Row 5 - EVENT DETAILS
      styleCell("A5", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      ws["!merges"].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 4 } });

      // Row 6 - Event Name
      styleCell("A6", { bold: true, size: 14, color: "1F1F1F", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 5, c: 0 }, e: { r: 5, c: 4 } });

      // Row 7 - NGO Name
      styleCell("A7", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 6, c: 0 }, e: { r: 6, c: 4 } });

      // Row 8 - Location
      styleCell("A8", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 7, c: 0 }, e: { r: 7, c: 4 } });

      // Row 9 - Date
      styleCell("A9", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 8, c: 0 }, e: { r: 8, c: 4 } });

      // Row 10 - Total Students
      styleCell("A10", { bold: false, size: 12, color: "404040", bgColor: "FFFFFF", align: "center" });
      ws["!merges"].push({ s: { r: 9, c: 0 }, e: { r: 9, c: 4 } });

      // Row 12 - Table Headers
      styleCell("A12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("B12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("C12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("D12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });
      styleCell("E12", { bold: true, size: 12, color: "FFFFFF", bgColor: "4472C4", align: "center" });

      // Style data rows
      eventAttendanceList.forEach((row, idx) => {
        const rowNum = 13 + idx;
        const bgColor = idx % 2 === 0 ? "FFFFFF" : "F2F2F2";
        
        styleCell(`A${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`B${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`C${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`D${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
        styleCell(`E${rowNum}`, { bold: false, size: 11, color: "333333", bgColor, align: "center" });
      });

      XLSX.utils.book_append_sheet(wb, ws, "Event Attendance");

      const filename = `event_attendance_${selectedEvent.aim?.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`;

      if (RNPlatform.OS === "web") {
        XLSX.writeFile(wb, filename);
        alert("Event attendance exported successfully!");
      } else {
        const wbout = XLSX.write(wb, {
          type: "base64",
          bookType: "xlsx",
        });

        const filepath = `${RealFileSystem.documentDirectory}${filename}`;

        await RealFileSystem.writeAsStringAsync(filepath, wbout, {
          encoding: RealFileSystem.EncodingType.Base64,
        });

        await RealSharing.shareAsync(filepath, {
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Event Attendance",
          UTI: "com.microsoft.excel.xlsx",
        });

        alert("Event attendance exported successfully!");
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

  const exportToExcel = async () => {
    try {
      setLoading(true);

      const wb = XLSX.utils.book_new();
      const collegeName = college.name || "College";
      const collegeAddress = college.address || "Address not available";

      // Create a sheet for each class
      college.classes.forEach((classData) => {
        if (!classData.students || classData.students.length === 0) {
          return; // Skip empty classes
        }

        // Prepare sheet data with all events for each student
        const sheetData = [
          [],
          [collegeName],
          [collegeAddress],
          [],
          [`CLASS: ${classData.className}`],
          [],
          ["Student Name", "PRN", "Department", "Event Name", "NGO Name", "Event Date", "Attendance Date"],
        ];

        // For each student, add a row for each event they attended
        classData.students.forEach((student) => {
          if (student.attendedEvents && student.attendedEvents.length > 0) {
            student.attendedEvents.forEach((event, idx) => {
              const eventName = event?.eventId?.aim || "N/A";
              const ngoName = event?.eventId?.createdBy?.name || "N/A";
              const eventDate = event?.eventId?.eventDate
                ? new Date(event.eventId.eventDate).toLocaleDateString()
                : "N/A";
              const attendanceDate = event?.attendanceMarkedAt
                ? new Date(event.attendanceMarkedAt).toLocaleDateString()
                : "N/A";

              sheetData.push([
                idx === 0 ? student.name : "", // Show student name only for first event
                idx === 0 ? student.prn : "",
                idx === 0 ? student.department : "",
                eventName,
                ngoName,
                eventDate,
                attendanceDate,
              ]);
            });
          } else {
            // If student hasn't attended any events
            sheetData.push([
              student.name || "",
              student.prn || "N/A",
              student.department || "",
              "No events attended",
              "N/A",
              "N/A",
              "N/A",
            ]);
          }
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        ws["!cols"] = [
          { wch: 22 },
          { wch: 15 },
          { wch: 18 },
          { wch: 20 },
          { wch: 18 },
          { wch: 15 },
          { wch: 18 },
        ];

        ws["!rows"] = [
          { hpx: 15 }, // Row 1: Empty
          { hpx: 32 }, // Row 2: College Name
          { hpx: 24 }, // Row 3: Address
          { hpx: 10 }, // Row 4: Empty
          { hpx: 28 }, // Row 5: Class Name
          { hpx: 10 }, // Row 6: Empty
          { hpx: 28 }, // Row 7: Table Header
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

        // Row 2 - College Name
        styleCell("A2", {
          bold: true,
          size: 18,
          color: "1F1F1F",
          bgColor: "FFFFFF",
          align: "center",
        });
        ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 6 } });

        // Row 3 - College Address
        styleCell("A3", {
          bold: false,
          size: 12,
          color: "404040",
          bgColor: "FFFFFF",
          align: "center",
        });
        ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 6 } });

        // Row 5 - Class Name
        styleCell("A5", {
          bold: true,
          size: 14,
          color: "FFFFFF",
          bgColor: "4472C4",
          align: "center",
        });
        ws["!merges"].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 6 } });

        // Row 7 - Table Headers
        const headerCells = ["A7", "B7", "C7", "D7", "E7", "F7", "G7"];
        headerCells.forEach((cell) => {
          styleCell(cell, {
            bold: true,
            size: 11,
            color: "FFFFFF",
            bgColor: "4472C4",
            align: "center",
          });
        });

        // Style data rows
        let currentRow = 8;
        classData.students.forEach((student) => {
          if (student.attendedEvents && student.attendedEvents.length > 0) {
            student.attendedEvents.forEach((event, idx) => {
              const bgColor = (currentRow - 8) % 2 === 0 ? "FFFFFF" : "F2F2F2";
              const dataCells = ["A", "B", "C", "D", "E", "F", "G"];

              dataCells.forEach((col) => {
                styleCell(`${col}${currentRow}`, {
                  bold: false,
                  size: 11,
                  color: "333333",
                  bgColor,
                  align: "center",
                });
              });
              currentRow++;
            });
          } else {
            // Style row for students with no events
            const bgColor = (currentRow - 8) % 2 === 0 ? "FFFFFF" : "F2F2F2";
            const dataCells = ["A", "B", "C", "D", "E", "F", "G"];

            dataCells.forEach((col) => {
              styleCell(`${col}${currentRow}`, {
                bold: false,
                size: 11,
                color: "333333",
                bgColor,
                align: "center",
              });
            });
            currentRow++;
          }
        });

        XLSX.utils.book_append_sheet(
          wb,
          ws,
          classData.className.slice(0, 31)
        );
      });

      const filename = `college_students_${college.name?.replace(
        /\s+/g,
        "_"
      )}_${new Date().getTime()}.xlsx`;

      if (RNPlatform.OS === "web") {
        XLSX.writeFile(wb, filename);
        alert("College data exported successfully!");
      } else {
        const wbout = XLSX.write(wb, {
          type: "base64",
          bookType: "xlsx",
        });

        const filepath = `${RealFileSystem.documentDirectory}${filename}`;

        await RealFileSystem.writeAsStringAsync(filepath, wbout, {
          encoding: RealFileSystem.EncodingType.Base64,
        });

        await RealSharing.shareAsync(filepath, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export College Data",
          UTI: "com.microsoft.excel.xlsx",
        });

        alert("College data exported successfully!");
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error exporting to Excel:", error);
      alert("Failed to export college data: " + error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textPrimary, marginTop: 10 }}>Exporting data...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleOutsideClick}
      style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}
    >
      <ScrollView showsVerticalScrollIndicator={true}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.accent }]}
            onPress={handleLogout}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.accent }]}
            onPress={exportToExcel}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Export Class-wise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.accent }]}
            onPress={exportAllEventsToExcel}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Export Events-wise</Text>
          </TouchableOpacity>
        </View>

        {/* Event-wise Attendance Section */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, marginBottom: 16 }]}
        >
          <Text style={[styles.title, { color: colors.header }]}>Event-wise Attendance</Text>
          
          <TouchableOpacity
            style={[styles.dropdownBtn, { backgroundColor: colors.iconBg, borderColor: colors.border }]}
            onPress={() => setShowEventDropdown(!showEventDropdown)}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
              {selectedEvent ? selectedEvent.aim : "Select Event"}
            </Text>
            <Text style={{ color: colors.textSecondary, marginLeft: 8 }}>▼</Text>
          </TouchableOpacity>

          {showEventDropdown && (
            <ScrollView style={{ maxHeight: 200, marginTop: 8 }}>
              {eventsList.map((event) => (
                <TouchableOpacity
                  key={event._id}
                  style={[styles.eventItem, { backgroundColor: colors.backgroundColors?.[1] || '#f5f5f5', borderColor: colors.border }]}
                  onPress={() => handleEventSelect(event)}
                >
                  <View>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{event.aim}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{event.createdBy}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                      {event.eventDate ? new Date(event.eventDate).toDateString() : "N/A"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {showAttendanceTable && selectedEvent && eventAttendanceList.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <View style={styles.attendanceHeaderRow}>
                <Text style={{ color: colors.header, fontWeight: '600' }}>
                  Total Attendance: {eventAttendanceList.length}
                </Text>
                <TouchableOpacity
                  style={[styles.eventExportBtn, { backgroundColor: colors.accent }]}
                  onPress={exportEventAttendanceToExcel}
                >
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>Export This Event</Text>
                </TouchableOpacity>
              </View>
              
              {/* Horizontal Scrolling Table */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginTop: 12 }}>
                <View>
                  {/* Table Header */}
                  <View style={[styles.tableHeader, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.tableHeaderCell, { width: 150 }]}>Student</Text>
                    <Text style={[styles.tableHeaderCell, { width: 120 }]}>PRN</Text>
                    <Text style={[styles.tableHeaderCell, { width: 120 }]}>Class</Text>
                    <Text style={[styles.tableHeaderCell, { width: 150 }]}>Attended Date</Text>
                  </View>

                  {/* Attendance List */}
                  {eventAttendanceList.map((record, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor: index % 2 === 0 ? colors.cardBg : colors.backgroundColors?.[1] || '#f9f9f9',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.tableCell, { width: 150, color: colors.textPrimary }]}>
                        {record.studentName}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120, color: colors.textSecondary }]}>
                        {record.prn}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120, color: colors.textSecondary }]}>
                        {record.className}
                      </Text>
                      <Text style={[styles.tableCell, { width: 150, color: colors.textSecondary }]}>
                        {record.attendanceDate}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {showAttendanceTable && selectedEvent && eventAttendanceList.length === 0 && (
            <Text style={{ color: colors.textSecondary, marginTop: 16, textAlign: 'center' }}>
              No attendance records for this event
            </Text>
          )}
        </TouchableOpacity>

        {/* Classes Section */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.header }]}>Classes</Text>

          <ScrollView style={{ maxHeight: 380 }}>
            {classes.map((c) => (
              <TouchableOpacity
                key={c._id || c.className}
                style={[styles.classItem, { backgroundColor: colors.iconBg, borderColor: colors.border }]}
                onPress={() => navigate('ClassStudents', { college, className: c.className })}
              >
                <Text style={{ color: colors.textPrimary }}>{c.className}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.iconBg, marginTop: 8, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => navigate('AddClass', { college })}
            >
              <Text style={{ color: colors.textPrimary }}>Add new class</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
    flexWrap: "wrap",
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  exportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
  },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  classItem: { padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1 },
  input: { padding: 12, borderRadius: 8 },
  addBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  dropdownBtn: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  attendanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  eventExportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 6,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    fontSize: 13,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 6,
    marginBottom: 2,
    borderWidth: 1,
  },
  tableCell: {
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 8,
  },
});
