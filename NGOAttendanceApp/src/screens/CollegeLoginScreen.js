import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Pressable } from 'react-native';
import { NavigationContext } from '../context/NavigationContext';
import { AttendanceContext } from '../context/AttendanceContext';

export default function CollegeLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { navigate, goBack } = useContext(NavigationContext);
  const { getColleges } = useContext(AttendanceContext);
  const colleges = getColleges();
  const [selectedCollege, setSelectedCollege] = useState('');

  function onLogin() {
    // static auth: accept any input
    if (!selectedCollege) return; // require selection
    navigate('CollegeRecords', { college: selectedCollege });
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>College Login</Text>

        <Text style={styles.label}>Select college</Text>
        <ScrollView style={styles.picker} contentContainerStyle={{ padding: 6 }}>
          {colleges.map(c => (
            <Pressable key={c} onPress={() => setSelectedCollege(c)} style={[styles.pickerItem, selectedCollege === c && styles.pickerItemActive]}>
              <Text style={[styles.pickerItemText, selectedCollege === c && styles.pickerItemTextActive]}>{c}</Text>
              {selectedCollege === c ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          ))}
        </ScrollView>

        {selectedCollege ? (
          <View style={styles.loginArea}>
            <Text style={styles.logging}>Logging in as <Text style={{ fontWeight: '700' }}>{selectedCollege}</Text></Text>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

            <TouchableOpacity style={styles.loginBtn} onPress={onLogin}><Text style={styles.loginText}>Login</Text></TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hint}>Please select a college to continue</Text>
        )}

      </View>

      <TouchableOpacity onPress={goBack} style={styles.cancel}><Text style={{ color: '#475569' }}>Cancel</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecfeff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#064e3b', marginBottom: 8, textAlign: 'center' },
  label: { color: '#334155', marginBottom: 8 },
  picker: { backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 12 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 6 },
  pickerItemActive: { backgroundColor: '#ecfeff' },
  pickerItemText: { color: '#0f172a' },
  pickerItemTextActive: { color: '#0b5563', fontWeight: '700' },
  check: { color: '#059669', fontWeight: '700' },
  loginArea: { marginTop: 6 },
  logging: { color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#eef2ff' },
  loginBtn: { backgroundColor: '#059669', padding: 14, borderRadius: 10, alignItems: 'center' },
  loginText: { color: '#fff', fontWeight: '700' },
  hint: { color: '#64748b', textAlign: 'center', marginTop: 8 },
  cancel: { marginTop: 12 },
});
