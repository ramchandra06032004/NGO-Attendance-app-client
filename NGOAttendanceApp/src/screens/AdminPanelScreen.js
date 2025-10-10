import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { AttendanceContext } from '../context/AttendanceContext';
import { NavigationContext } from '../context/NavigationContext';

export default function AdminPanelScreen() {
  const { addCollege, addNgo, colleges, ngos } = useContext(AttendanceContext);
  const { navigate } = useContext(NavigationContext);
  const [newCollege, setNewCollege] = useState('');
  const [newNgo, setNewNgo] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity onPress={() => navigate('Home')}><Text style={{ color: '#475569' }}>Home</Text></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add College</Text>
        <View style={{ flexDirection: 'row' }}>
          <TextInput value={newCollege} onChangeText={setNewCollege} placeholder="College name" style={styles.input} />
          <TouchableOpacity style={styles.addBtn} onPress={() => { addCollege(newCollege); setNewCollege(''); }}><Text style={{ color: '#fff' }}>Add</Text></TouchableOpacity>
        </View>

        <Text style={{ marginTop: 12, fontWeight: '700' }}>Colleges</Text>
        <FlatList data={colleges} keyExtractor={i => i} renderItem={({ item }) => <Text style={{ paddingVertical: 6 }}>{item}</Text>} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add NGO</Text>
        <View style={{ flexDirection: 'row' }}>
          <TextInput value={newNgo} onChangeText={setNewNgo} placeholder="NGO name" style={styles.input} />
          <TouchableOpacity style={styles.addBtn} onPress={() => { addNgo(newNgo); setNewNgo(''); }}><Text style={{ color: '#fff' }}>Add</Text></TouchableOpacity>
        </View>

        <Text style={{ marginTop: 12, fontWeight: '700' }}>NGOs</Text>
        <FlatList data={ngos} keyExtractor={i => i} renderItem={({ item }) => <Text style={{ paddingVertical: 6 }}>{item}</Text>} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0fdf4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#065f46' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
  input: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ecfccb' },
  addBtn: { backgroundColor: '#10b981', padding: 10, borderRadius: 8, marginLeft: 8, justifyContent: 'center' },
});
