import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Pressable } from 'react-native';
import { NavigationContext } from '../context/NavigationContext';
import { AttendanceContext } from '../context/AttendanceContext';

export default function NgoLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { navigate, goBack } = useContext(NavigationContext);
  const { ngos } = useContext(AttendanceContext);
  const [selectedNgo, setSelectedNgo] = useState('');

  function onLogin() {
    // static auth: accept any input
    if (!selectedNgo) return;
    navigate('NgoEvents', { ngo: selectedNgo });
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>NGO Login</Text>

        <Text style={styles.label}>Select NGO</Text>
        <ScrollView style={styles.picker} contentContainerStyle={{ padding: 6 }}>
          {ngos.length === 0 ? (
            <Text style={{ color: '#64748b', marginBottom: 8 }}>No NGOs added yet</Text>
          ) : (
            ngos.map(n => (
              <Pressable key={n} onPress={() => setSelectedNgo(n)} style={[styles.pickerItem, selectedNgo === n && styles.pickerItemActive]}>
                <Text style={[styles.pickerItemText, selectedNgo === n && styles.pickerItemTextActive]}>{n}</Text>
                {selectedNgo === n ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            ))
          )}
        </ScrollView>

        {selectedNgo ? (
          <>
            <Text style={{ marginTop: 8, color: '#334155' }}>Signing in as: {selectedNgo}</Text>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

            <TouchableOpacity style={styles.loginBtn} onPress={onLogin}><Text style={styles.loginText}>Login</Text></TouchableOpacity>
          </>
        ) : (
          <Text style={{ color: '#64748b', marginTop: 8 }}>Please select an NGO to proceed</Text>
        )}
      </View>

      <TouchableOpacity onPress={goBack} style={{ marginTop: 12 }}><Text style={{ color: '#475569' }}>Cancel</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#92400e', marginBottom: 8, textAlign: 'center' },
  label: { color: '#334155', marginBottom: 8, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fef3c7' },
  loginBtn: { backgroundColor: '#f59e0b', padding: 14, borderRadius: 10, alignItems: 'center' },
  loginText: { color: '#fff', fontWeight: '700' },
  picker: { backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 12 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 6 },
  pickerItemActive: { backgroundColor: '#ecfeff' },
  pickerItemText: { color: '#0f172a' },
  pickerItemTextActive: { color: '#0b5563', fontWeight: '700' },
  check: { color: '#059669', fontWeight: '700' },
});
