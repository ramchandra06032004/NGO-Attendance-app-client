import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform as RNPlatform, ActivityIndicator, FlatList } from 'react-native';
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
  const { logout } = useContext(AuthContext);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [eventAttendanceList, setEventAttendanceList] = useState([]);
  const [showAttendanceTable, setShowAttendanceTable] = useState(false);

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
    console.log("exporting to excel" );
    
    try {
      if (eventsList.length === 0) {
        alert("No events to export");
        return;
      }

      setLoading(true);

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NGO Attendance App';
      workbook.created = new Date();

      // 1. Handle Logo Image
      let logoImageId = null;
      if (college.logoUrl) {
        try {
          // Download image to cache to get base64
          console.log("downloading the imahe");
          
          const fileUri = FileSystem.cacheDirectory + 'college_logo_temp.png';
          const downloadRes = await FileSystem.downloadAsync(college.logoUrl, fileUri);
          
          if (downloadRes.status === 200) {
            const base64 = await FileSystem.readAsStringAsync(fileUri, {
              encoding: 'base64',
            });
            
            logoImageId = workbook.addImage({
              base64: base64,
              extension: 'png',
            });
          }
        } catch (imgError) {
          console.log("Error loading logo for export:", imgError);
          // Continue without logo if it fails
        }
      }

      const collegeName = college.name || "College";
      const collegeAddress = college.address || "Address not available";
      let hasData = false;

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
        hasData = true;

        const eventName = event.aim || "N/A";
        // Sheet names cannot exceed 31 chars and cannot contain special chars
        const safeSheetName = (eventName.replace(/[\\/?*[\]]/g, "")).slice(0, 30);
        const worksheet = workbook.addWorksheet(safeSheetName);

        // Define Columns
        worksheet.columns = [
          { width: 25 }, // A
          { width: 20 }, // B
          { width: 20 }, // C
          { width: 20 }, // D
          { width: 20 }, // E
        ];

        // --- Add Logo ---
        if (logoImageId !== null) {
          worksheet.addImage(logoImageId, {
            tl: { col: 0, row: 0 }, // Top-left: A1
            ext: { width: 100, height: 100 },
          });
        }

        // --- Header Styling ---
        // College Name (Centered across B-E, assuming logo is in A)
        worksheet.mergeCells('B2:E2');
        const nameCell = worksheet.getCell('B2');
        nameCell.value = collegeName;
        nameCell.font = { name: 'Arial', size: 18, bold: true };
        nameCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // College Address
        worksheet.mergeCells('B3:E3');
        const addrCell = worksheet.getCell('B3');
        addrCell.value = collegeAddress;
        addrCell.font = { name: 'Arial', size: 12, color: { argb: 'FF404040' } };
        addrCell.alignment = { vertical: 'middle', horizontal: 'center' };

        // Spacing for logo
        worksheet.addRow([]); 
        worksheet.addRow([]); 
        worksheet.addRow([]); 
        worksheet.addRow([]); 
        worksheet.addRow([]); // Ensure we are below the logo (approx row 6)

        // Event Details Header
        const startRow = 7;
        const titleRow = worksheet.getRow(startRow);
        worksheet.mergeCells(`A${startRow}:E${startRow}`);
        titleRow.getCell(1).value = "EVENT DETAILS";
        titleRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        titleRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

        // Event Info Helper
        const addInfoRow = (label, value, isBold = false) => {
          const row = worksheet.addRow([`${label}: ${value}`]);
          worksheet.mergeCells(`A${row.number}:E${row.number}`);
          const cell = row.getCell(1);
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { size: 12, bold: isBold };
          if (isBold) cell.font.size = 14;
        };

        addInfoRow(`Event`, eventName, true);
        addInfoRow(`NGO`, event.createdBy || "N/A");
        addInfoRow(`Location`, event.location || "N/A");
        addInfoRow(`Date`, new Date(event.eventDate).toLocaleDateString() || "N/A");
        addInfoRow(`Total Students Present`, eventAttendance.length);

        worksheet.addRow([]); // Empty row

        // Table Headers
        const headerRow = worksheet.addRow(["Student Name", "PRN", "Department", "Class", "Attendance Date"]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Data Rows
        eventAttendance.forEach((record, idx) => {
          const row = worksheet.addRow([
            record.studentName || "",
            record.prn || "",
            record.department || "",
            record.className || "",
            record.attendanceDate || "N/A",
          ]);
          
          // Zebra striping
          if (idx % 2 !== 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' }
              };
            });
          }

          // Borders and alignment
          row.eachCell((cell) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          });
        });
      });

      if (!hasData) {
        setLoading(false);
        return;
      }

      const filename = `all_events_${college.name?.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`;

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      if (RNPlatform.OS === "web") {
        // Basic web fallback
        alert("Export generated. (Web download requires Blob implementation)");
      } else {
        await saveFile(filename, base64);
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

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NGO Attendance App';
      workbook.created = new Date();

      // 1. Handle Logo Image
      let logoImageId = null;
      if (college.logoUrl) {
        try {
          // Download image to cache to get base64
          const fileUri = FileSystem.cacheDirectory + 'college_logo_temp.png';
          const downloadRes = await FileSystem.downloadAsync(college.logoUrl, fileUri);
          
          if (downloadRes.status === 200) {
            const base64 = await FileSystem.readAsStringAsync(fileUri, {
              encoding: 'base64',
            });
            
            logoImageId = workbook.addImage({
              base64: base64,
              extension: 'png',
            });
          }
        } catch (imgError) {
          console.log("Error loading logo for export:", imgError);
          // Continue without logo if it fails
        }
      }

      const collegeName = college.name || "College";
      const collegeAddress = college.address || "Address not available";
      const eventName = selectedEvent.aim || "N/A";

      // Sheet names cannot exceed 31 chars and cannot contain special chars
      const safeSheetName = (eventName.replace(/[\\/?*[\]]/g, "")).slice(0, 30);
      const worksheet = workbook.addWorksheet(safeSheetName);

      // Define Columns
      worksheet.columns = [
        { width: 25 }, // A
        { width: 20 }, // B
        { width: 20 }, // C
        { width: 20 }, // D
        { width: 20 }, // E
      ];

      // --- Add Logo ---
      if (logoImageId !== null) {
        worksheet.addImage(logoImageId, {
          tl: { col: 0, row: 0 }, // Top-left: A1
          ext: { width: 100, height: 100 },
        });
      }

      // --- Header Styling ---
      // College Name (Centered across B-E, assuming logo is in A)
      worksheet.mergeCells('B2:E2');
      const nameCell = worksheet.getCell('B2');
      nameCell.value = collegeName;
      nameCell.font = { name: 'Arial', size: 18, bold: true };
      nameCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // College Address
      worksheet.mergeCells('B3:E3');
      const addrCell = worksheet.getCell('B3');
      addrCell.value = collegeAddress;
      addrCell.font = { name: 'Arial', size: 12, color: { argb: 'FF404040' } };
      addrCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Spacing for logo
      worksheet.addRow([]); 
      worksheet.addRow([]); 
      worksheet.addRow([]); 
      worksheet.addRow([]); 
      worksheet.addRow([]); // Ensure we are below the logo (approx row 6)

      // Event Details Header
      const startRow = 7;
      const titleRow = worksheet.getRow(startRow);
      worksheet.mergeCells(`A${startRow}:E${startRow}`);
      titleRow.getCell(1).value = "EVENT DETAILS";
      titleRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      titleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Event Info Helper
      const addInfoRow = (label, value, isBold = false) => {
        const row = worksheet.addRow([`${label}: ${value}`]);
        worksheet.mergeCells(`A${row.number}:E${row.number}`);
        const cell = row.getCell(1);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { size: 12, bold: isBold };
        if (isBold) cell.font.size = 14;
      };

      addInfoRow(`Event`, eventName, true);
      addInfoRow(`NGO`, selectedEvent.createdBy || "N/A");
      addInfoRow(`Location`, selectedEvent.location || "N/A");
      addInfoRow(`Date`, new Date(selectedEvent.eventDate).toLocaleDateString() || "N/A");
      addInfoRow(`Total Students Present`, eventAttendanceList.length);

      worksheet.addRow([]); // Empty row

      // Table Headers
      const headerRow = worksheet.addRow(["Student Name", "PRN", "Department", "Class", "Attendance Date"]);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Data Rows
      eventAttendanceList.forEach((record, idx) => {
        const row = worksheet.addRow([
          record.studentName || "",
          record.prn || "",
          record.department || "",
          record.className || "",
          record.attendanceDate || "N/A",
        ]);
        
        // Zebra striping
        if (idx % 2 !== 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          });
        }

        // Borders and alignment
        row.eachCell((cell) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };
        });
      });

      const filename = `event_attendance_${selectedEvent.aim?.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`;

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      if (RNPlatform.OS === "web") {
        // Basic web fallback
        alert("Export generated. (Web download requires Blob implementation)");
      } else {
        await saveFile(filename, base64);
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

        await saveFile(filename, wbout);
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
