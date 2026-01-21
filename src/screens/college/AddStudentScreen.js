import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { AttendanceContext } from '../../context/AttendanceContext';
import { useTheme } from '../../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import * as api from '../../../apis/api';

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
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'application/octet-stream'], copyToCacheDirectory: true });
      if (res.type !== 'success') return;

      const fileUri = res.uri;
      const fileStr = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });

      // parse base64 content into workbook
      const workbook = XLSX.read(fileStr, { type: 'base64' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

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

      // merge into current students list
      setStudents(prev => [...prev, ...mapped]);
      Alert.alert('Imported', `${mapped.length} students were parsed and added to the list.`);
    } catch (err) {
      console.warn('Failed to parse file', err);
      Alert.alert('Import failed', 'Could not parse the selected file.');
    }
  }

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
        credentials:'include',
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
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-xl font-bold mb-3" style={{ color: colors.header }}>Add Students to {className}</Text>

        <Text className="text-base font-semibold mt-3 mb-2" style={{ color: colors.textPrimary }}>Add students</Text>
        {students.map((s, idx) => (
          <View key={s.id} className="p-3 rounded-lg border mb-3" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
            <TextInput placeholder="Name" placeholderTextColor={colors.textSecondary} value={s.name} onChangeText={(v) => updateStudent(idx, 'name', v)} className="p-2 rounded-lg border mb-2" style={{ color: colors.textPrimary, backgroundColor: colors.iconBg, borderColor: colors.border }} />
            <TextInput placeholder="PRN" placeholderTextColor={colors.textSecondary} value={s.prn} onChangeText={(v) => updateStudent(idx, 'prn', v)} className="p-2 rounded-lg border mb-2" style={{ color: colors.textPrimary, backgroundColor: colors.iconBg, borderColor: colors.border }} />
            <TextInput placeholder="Department" placeholderTextColor={colors.textSecondary} value={s.department} onChangeText={(v) => updateStudent(idx, 'department', v)} className="p-2 rounded-lg border mb-2" style={{ color: colors.textPrimary, backgroundColor: colors.iconBg, borderColor: colors.border }} />
            <TextInput placeholder="Email" placeholderTextColor={colors.textSecondary} value={s.email} onChangeText={(v) => updateStudent(idx, 'email', v)} className="p-2 rounded-lg border mb-2" style={{ color: colors.textPrimary, backgroundColor: colors.iconBg, borderColor: colors.border }} />
            <View className="flex-row justify-between">
              <TouchableOpacity onPress={() => addEmptyStudent()} className="p-2 rounded-lg flex-1 mr-2 items-center" style={{ backgroundColor: colors.accent }}>
                <Text className="text-white text-sm">Add student</Text>
              </TouchableOpacity>
              {students.length > 1 && (
                <TouchableOpacity onPress={() => removeStudent(idx)} className="p-2 rounded-lg flex-1 items-center" style={{ backgroundColor: '#888' }}>
                  <Text className="text-white text-sm">Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <Text className="text-base font-semibold mt-3 mb-2" style={{ color: colors.textPrimary }}>Upload Excel sheet</Text>
        <View className="flex-row items-center gap-2 mb-3">
          <TouchableOpacity onPress={pickAndParseFile} className="p-2 rounded-lg px-3" style={{ backgroundColor: colors.accent }}>
            <Text className="text-white text-sm">Pick Excel file</Text>
          </TouchableOpacity>
          <Text className="flex-1 text-sm" style={{ color: colors.textSecondary }}>Pick an .xlsx/.xls/.csv with student rows (Name, PRN, Department, Email)</Text>
        </View>

        <TouchableOpacity className="p-3 rounded-lg items-center mt-3" style={{ backgroundColor: colors.accent }} onPress={onSave}>
          <Text className="text-white font-bold">Save Students</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-3" onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
