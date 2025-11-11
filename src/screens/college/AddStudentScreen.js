import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
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
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={[styles.title, { color: colors.header }]}>Add Students to {className}</Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 12 }]}>Add students</Text>
        {students.map((s, idx) => (
          <View key={s.id} style={[styles.studentRow, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
            <TextInput placeholder="Name" placeholderTextColor={colors.textSecondary} value={s.name} onChangeText={(v) => updateStudent(idx, 'name', v)} style={[styles.smallInput, { color: colors.textPrimary }]} />
            <TextInput placeholder="PRN" placeholderTextColor={colors.textSecondary} value={s.prn} onChangeText={(v) => updateStudent(idx, 'prn', v)} style={[styles.smallInput, { color: colors.textPrimary }]} />
            <TextInput placeholder="Department" placeholderTextColor={colors.textSecondary} value={s.department} onChangeText={(v) => updateStudent(idx, 'department', v)} style={[styles.smallInput, { color: colors.textPrimary }]} />
            <TextInput placeholder="Email" placeholderTextColor={colors.textSecondary} value={s.email} onChangeText={(v) => updateStudent(idx, 'email', v)} style={[styles.smallInput, { color: colors.textPrimary }]} />
            <View style={styles.studentActions}>
              <TouchableOpacity onPress={() => addEmptyStudent()} style={[styles.actionBtn, { backgroundColor: colors.accent }]}>
                <Text style={{ color: '#fff' }}>Add student</Text>
              </TouchableOpacity>
              {students.length > 1 && (
                <TouchableOpacity onPress={() => removeStudent(idx)} style={[styles.actionBtn, { backgroundColor: '#888' }]}>
                  <Text style={{ color: '#fff' }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 12 }]}>Upload Excel sheet</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={pickAndParseFile} style={[styles.actionBtn, { backgroundColor: colors.accent, paddingHorizontal: 12 }] }>
            <Text style={{ color: '#fff' }}>Pick Excel file</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textSecondary, flex: 1 }}>Pick an .xlsx/.xls/.csv with student rows (Name, PRN, Department, Email)</Text>
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={onSave}>
          <Text style={{ color: '#fff' }}>Save Students</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { padding: 12, borderRadius: 8, borderWidth: 1 },
  studentRow: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  smallInput: { padding: 8, borderRadius: 6, borderWidth: 1, marginBottom: 8 },
  studentActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { padding: 8, borderRadius: 8, alignItems: 'center', flex: 1, marginRight: 8 },
  uploadBox: { padding: 20, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
});
