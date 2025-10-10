import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, Pressable, ScrollView } from 'react-native';
import { AttendanceContext } from '../context/AttendanceContext';
import { NavigationContext } from '../context/NavigationContext';

export default function NgoEventsScreen({ ngo: loggedNgo }) {
  const { events, addEvent } = useContext(AttendanceContext);
  const { navigate, goBack } = useContext(NavigationContext);
  const [newTitle, setNewTitle] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const { getColleges } = useContext(AttendanceContext);
  const colleges = getColleges();
  const [selectedCollege, setSelectedCollege] = useState(colleges[0] || '');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}><Text style={{color:'#1f2937'}}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>Events</Text>
        {loggedNgo ? (
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: 10, fontWeight: '700' }}>{loggedNgo}</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => navigate('Home')}><Text style={{ color: '#fff' }}>Logout</Text></TouchableOpacity>
          </View>
        ) : null}
      </View>

      <FlatList
        data={events}
        keyExtractor={i => i.id}
        style={{ width: '100%' }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.eventCard} onPress={() => navigate('EventDetail', { eventId: item.id })}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventCount}>{item.students.length} students</Text>
          </TouchableOpacity>
        )}
      />

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Event</Text>
            <TextInput placeholder="Event title" value={newTitle} onChangeText={setNewTitle} style={styles.input} />

            <Text style={{ marginTop: 8, marginBottom: 6, color: '#334155' }}>Select college</Text>
            <ScrollView style={styles.picker}>
              {colleges.map(c => (
                <Pressable key={c} onPress={() => setSelectedCollege(c)} style={[styles.pickerItem, selectedCollege === c && styles.pickerItemActive]}>
                  <Text style={{ color: selectedCollege === c ? '#075985' : '#0f172a' }}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity style={[styles.addBtn, { flex: 1 }]} onPress={() => {
                if (newTitle.trim()) { addEvent(newTitle.trim(), selectedCollege); setNewTitle(''); setSelectedCollege(colleges[0] || ''); setModalVisible(false); }
              }}>
                <Text style={{ color: '#fff' }}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { marginLeft: 10 }]} onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Add Event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#eef2ff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { paddingRight: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  eventCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10 },
  eventTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  eventCount: { color: '#64748b', marginTop: 6 },
  input: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 10, marginRight: 10 },
  addBtn: { backgroundColor: '#06b6d4', padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 10, alignItems: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: '#0ea5a4', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  picker: { maxHeight: 150, backgroundColor: '#f8fafc', borderRadius: 8 },
  pickerItem: { padding: 12 },
  pickerItemActive: { backgroundColor: '#e0f2fe' },
  logoutBtn: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
});
