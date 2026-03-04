import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { AttendanceContext } from '../../context/AttendanceContext';
import { useTheme } from '../../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import * as ExcelJS from 'exceljs';
import * as api from '../../../apis/api';
import { Buffer } from 'buffer';

export default function AddStudentScreen({ college, className }) {
  const { goBack } = useContext(NavigationContext);
  const { addStudent } = useContext(AttendanceContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  // Manage a dynamic list of students to add
  const [students, setStudents] = useState([
    { id: Date.now().toString(), name: '', prn: '', department: '', email: '' },
  ]);

  function updateStudent(idx, key, value) {
    setStudents(prev => prev.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));
  }

  function addEmptyStudent() {
    setStudents(prev => [...prev, { id: Date.now().toString() + Math.random().toString(36).slice(2), name: '', prn: '', department: '', email: '' }]);
  }

  async function pickAndParseFile() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'application/octet-stream'],
        copyToCacheDirectory: true
      });

      // Check if user canceled the picker
      if (res.canceled) return;

      // Get the file URI from the assets array
      const fileUri = res.assets[0].uri;
      const fileName = res.assets[0].name || '';

      let rows = [];

      // Check if it's a CSV file
      if (fileName.toLowerCase().endsWith('.csv')) {
        // Read as UTF-8 for CSV
        const csvContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' });

        // Parse CSV manually
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          Alert.alert('No data found in CSV file');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });
          rows.push(rowData);
        }
      } else {
        // Handle Excel files (.xlsx, .xls)
        const fileStr = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });

        // parse base64 content into workbook using ExcelJS
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(Buffer.from(fileStr, 'base64'));

        const worksheet = workbook.worksheets[0];

        // Get headers from first row
        const headerRow = worksheet.getRow(1);
        const headers = [];
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value;
        });

        // Parse data rows
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
              rowData[header] = cell.value || '';
            }
          });
          rows.push(rowData);
        });
      }

      if (!rows || rows.length === 0) {
        Alert.alert('No rows found in the selected file');
        return;
      }

      // Map rows to expected student fields. We'll try common header names.
      const mapped = rows.map(r => {
        const name = r.name || r.Name || r['Student name'] || r['Student Name'] || r.student || '';
        const prn = r.prn || r.PRN || r.Prn || r['PRN'] || r.roll || r.Roll || '';
        const department = r.department || r.dept || r.Department || r.Dept || '';
        const email = r.email || r.Email || '';
        return { id: Date.now().toString() + Math.random().toString(36).slice(2), name: String(name).trim(), prn: String(prn).trim(), department: String(department).trim(), email: String(email).trim() };
      }).filter(s => s.name);

      if (mapped.length === 0) {
        Alert.alert('No student rows found. Make sure the file has a header with a Name column or similar.');
        return;
      }

      // Filter out empty students from current list and merge with imported students
      setStudents(prev => {
        const nonEmptyStudents = prev.filter(s => s.name.trim());
        return [...nonEmptyStudents, ...mapped];
      });
      Alert.alert('Imported', `${mapped.length} students were parsed and added to the list.`);
    } catch (err) {
      console.warn('Failed to parse file', err);
      Alert.alert('Import failed', 'Could not parse the selected file.');
    }
  }

  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Students');

      // 1. Setup Headers & Columns
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'PRN', key: 'prn', width: 15 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
      ];

      // Add Sample Row
      worksheet.addRow(['John Doe', '123456', 'Computer Science', 'john@example.com']);

      // 2. Generate Excel Buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const base64String = Buffer.from(buffer).toString('base64');
      const filename = 'Student_Template.xlsx';

      // --- WEB DOWNLOAD ---
      if (Platform.OS === 'web') {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        window.URL.revokeObjectURL(url);
        return;
      }

      // --- ANDROID "SAVE TO DEVICE" (SAF) ---
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
          // Creates a blank file in the user-selected directory
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            filename,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          );

          // Writes the Excel data into that file
          await FileSystem.writeAsStringAsync(uri, base64String, {
            encoding: FileSystem.EncodingType.Base64,
          });

          Alert.alert('Success', 'Template saved to your device!');
        } else {
          // Fallback to sharing if they deny folder access
          await shareFallback(base64String, filename);
        }
      }

      // --- iOS "SAVE TO FILES" ---
      else {
        // iOS handles "Save to Files" natively within the Share Sheet
        await shareFallback(base64String, filename);
      }

    } catch (error) {
      console.error('Error downloading template:', error);
      Alert.alert('Error', 'Failed to generate template');
    }
  };

  // Helper function for iOS or Android fallback
  const shareFallback = async (base64String, filename) => {
    const fileUri = FileSystem.cacheDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, base64String, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Save Student Template',
      UTI: 'com.microsoft.excel.xlsx', // Required for iOS to recognize Excel
    });
  };

  function removeStudent(idx) {
    setStudents(prev => prev.filter((_, i) => i !== idx));
  }

  async function onSave() {
    try {
      // Find the class ID from college.classes
      const selectedClass = college.classes.find(c => c.className === className);
      if (!selectedClass) {
        Alert.alert('Error', 'Class not found');
        return;
      }

      const classId = selectedClass._id;

      // Prepare the request body
      const requestBody = {
        classId: classId,
        students: students.filter(s => s.name.trim()).map(s => ({
          name: s.name.trim(),
          department: s.department.trim(),
          email: s.email.trim(),
          prn: s.prn.trim()
        }))
      };
      console.log(requestBody)
      // Call the API
      const response = await fetch(api.addStudentAPI, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Students added successfully');
        goBack();
      } else {
        Alert.alert('Error', result.message || 'Failed to add students');
      }
    } catch (error) {
      console.error('Error adding students:', error);
      Alert.alert('Error', 'Failed to add students');
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }}>
      {/* Header with Back Button and Save */}
      <View className="px-4 pt-12 pb-3" style={{ backgroundColor: colors.cardBg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => goBack()} className="flex-row items-center">
            <Text className="text-base" style={{ color: colors.textPrimary }}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity className="p-2 px-4 rounded-lg" style={{ backgroundColor: colors.accent }} onPress={onSave}>
            <Text className="text-white font-bold">Save ({students.filter(s => s.name.trim()).length})</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-xl font-bold" style={{ color: colors.header }}>Add Students to {className}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Upload Section */}
        <View className="p-4 rounded-lg mb-4" style={{ backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1 }}>
          <Text className="text-base font-semibold mb-3" style={{ color: colors.textPrimary }}>Import from File</Text>

          <TouchableOpacity onPress={downloadTemplate} className="p-3 rounded-lg items-center mb-3 border" style={{ borderColor: colors.accent, backgroundColor: 'transparent' }}>
            <Text className="font-semibold" style={{ color: colors.accent }}>Download Excel Template</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickAndParseFile} className="p-3 rounded-lg items-center mb-2" style={{ backgroundColor: colors.accent }}>
            <Text className="text-white font-semibold">Pick Excel/CSV File</Text>
          </TouchableOpacity>
          <Text className="text-xs text-center" style={{ color: colors.textSecondary }}>
            Supported: .xlsx, .xls, .csv with columns: Name, PRN, Department, Email
          </Text>
        </View>

        {/* Summary Card */}
        <View className="p-4 rounded-lg mb-4" style={{ backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1 }}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>Total Students</Text>
              <Text className="text-2xl font-bold" style={{ color: colors.accent }}>{students.filter(s => s.name.trim()).length}</Text>
            </View>
            <TouchableOpacity onPress={addEmptyStudent} className="p-2 px-4 rounded-lg" style={{ backgroundColor: colors.accent }}>
              <Text className="text-white font-semibold">+ Add Manually</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Students List */}
        <Text className="text-base font-semibold mb-2" style={{ color: colors.textPrimary }}>Student List</Text>

        {students.map((s, idx) => (
          <View key={s.id} className="mb-2 rounded-lg overflow-hidden" style={{ backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1 }}>
            {/* Compact Header */}
            <View className="flex-row items-center justify-between p-2 px-3" style={{ backgroundColor: colors.iconBg }}>
              <Text className="font-semibold" style={{ color: colors.textPrimary }}>
                {idx + 1}. {s.name || 'New Student'}
              </Text>
              <TouchableOpacity onPress={() => removeStudent(idx)} className="p-1 px-3 rounded" style={{ backgroundColor: '#ef4444' }}>
                <Text className="text-white text-xs font-semibold">Remove</Text>
              </TouchableOpacity>
            </View>

            {/* Editable Fields */}
            <View className="p-3">
              <View className="mb-2">
                <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>Name</Text>
                <TextInput
                  placeholder="Student Name"
                  placeholderTextColor={colors.textSecondary}
                  value={s.name}
                  onChangeText={(v) => updateStudent(idx, 'name', v)}
                  className="p-2 rounded border"
                  style={{ color: colors.textPrimary, backgroundColor: colors.iconBg, borderColor: colors.border }}
                />
              </View>

              <View className="flex-row gap-2 mb-2">
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>PRN</Text>
                  <TextInput
                    placeholder="PRN"
                    placeholderTextColor={colors.textSecondary}
                    value={s.prn}
                    onChangeText={(v) => updateStudent(idx, 'prn', v)}
                    className="p-2 rounded border"
                    style={{ color: colors.textPrimary, backgroundColor: colors.iconBg, borderColor: colors.border }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>Department</Text>
                  <TextInput
                    placeholder="Department"
                    placeholderTextColor={colors.textSecondary}
                    value={s.department}
                    onChangeText={(v) => updateStudent(idx, 'department', v)}
                    className="p-2 rounded border"
                    style={{ color: colors.textPrimary, backgroundColor: colors.iconBg, borderColor: colors.border }}
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>Email</Text>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={s.email}
                  onChangeText={(v) => updateStudent(idx, 'email', v)}
                  className="p-2 rounded border"
                  style={{ color: colors.textPrimary, backgroundColor: colors.iconBg, borderColor: colors.border }}
                />
              </View>
            </View>
          </View>
        ))}


      </ScrollView>
    </View>
  );
}
