import React, { useContext, useEffect, useState, useMemo, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, TextInput, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { studentEventsAPI } from '../../../apis/api';

export default function StudentEventsScreen({ college, studentId }) {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [student, setStudent] = useState({ name: 'Student', id: studentId, attendedEvents: [] });
  const [className, setClassName] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [loading, setLoading] = useState(false);
  const { accessToken } = useContext(AuthContext);

  // Filter States
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile Picker Visibility
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Helper to determine Present / Absent / Registered status
  const getEventStatus = (eventObj, attendanceDateStr) => {
    if (attendanceDateStr && attendanceDateStr !== 'N/A') return 'Present';
    if (!eventObj || !eventObj.eventDate) return 'Registered';
    const eventDate = new Date(eventObj.eventDate);
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today ? 'Absent' : 'Registered';
  };

  useEffect(() => {
    const fetchStudentAndEvents = async () => {
      setLoading(true);
      try {
        // 1. Get student basic info from college prop
        const foundStudent = college.classes.flatMap(c => c.students).find(s => s._id.toString() === studentId) || { name: 'Student', id: studentId, attendedEvents: [] };
        setStudent(foundStudent);

        const foundClass = college.classes.find(c => c.students.some(s => s._id.toString() === studentId));
        setClassName(foundClass ? foundClass.className : '');

        // 2. Fetch ALL events from API (allows us to see registrations, not just attendance)
        const response = await fetch(studentEventsAPI, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        const apiEvents = data?.data?.events || [];

        // 3. Filter events where this student is registered
        // Logic: event.colleges contains collegeId, and that college's students list contains studentId
        const studentRegistrations = apiEvents.filter(ev => {
          return ev.colleges?.some(c =>
            c.collegeId?.toString() === college._id?.toString() &&
            c.students?.some(sId => sId?.toString() === studentId)
          );
        });

        // 4. Map to display objects with status
        const processedEvents = studentRegistrations.map(ev => {
          // Check if student actually attended (from their own attendedEvents record)
          const attendanceRecord = foundStudent.attendedEvents?.find(att => att.eventId?._id?.toString() === ev._id?.toString());
          const attendedDate = attendanceRecord?.attendanceMarkedAt ? new Date(attendanceRecord.attendanceMarkedAt).toDateString() : 'N/A';

          return {
            eventName: ev.aim || 'General Event',
            ngoName: ev.createdBy?.name || 'N/A',
            eventLocation: ev.location || 'Campus',
            rawDate: ev.eventDate ? new Date(ev.eventDate) : null,
            eventDate: ev.eventDate ? new Date(ev.eventDate).toDateString() : 'N/A',
            attendedDate,
            status: getEventStatus(ev, attendedDate),
          };
        });

        setAllEvents(processedEvents);
        setFilteredEvents(processedEvents);
      } catch (err) {
        console.error("Error loading student events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndEvents();
  }, [studentId, accessToken, college]);

  // Use useMemo to compute filtered events - prevents infinite loop
  const computedFilteredEvents = useMemo(() => {
    // Only filter if there are active filters, otherwise show all events
    if (!searchQuery.trim() && !startDate && !endDate) {
      return allEvents;
    }

    let filtered = allEvents;

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ev =>
        ev.eventName?.toLowerCase().includes(query) ||
        ev.eventLocation?.toLowerCase().includes(query) ||
        ev.ngoName?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(ev => ev.rawDate && ev.rawDate >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(ev => ev.rawDate && ev.rawDate <= end);
    }

    return filtered;
  }, [searchQuery, startDate, endDate, allEvents]);

  // Update filteredEvents when computed value changes
  useEffect(() => {
    setFilteredEvents(computedFilteredEvents);
  }, [computedFilteredEvents]);


  const clearFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setSearchQuery('');
  };

  const onDateChange = (event, selectedDate, type) => {
    if (type === 'start') {
      setShowStartPicker(Platform.OS === 'ios');
      if (selectedDate) setStartDate(selectedDate);
    } else {
      setShowEndPicker(Platform.OS === 'ios');
      if (selectedDate) setEndDate(selectedDate);
    }
  };

  // --- HYBRID DATE INPUT COMPONENT ---
  const DateInputBox = ({ label, dateValue, setShowPicker, showPicker, onChangeType }) => {

    // 1. WEB VERSION: Uses standard HTML <input type="date">
    if (Platform.OS === 'web') {
      const dateString = dateValue ? dateValue.toISOString().split('T')[0] : '';

      return (
        <View className="flex-1 mr-2">
          <Text className="text-[10px] uppercase font-bold mb-1" style={{ color: colors.textSecondary }}>{label}</Text>
          <View style={{
            borderBottomWidth: 1,
            borderColor: colors.border,
            paddingVertical: 4,
            height: 35,
            justifyContent: 'center'
          }}>
            {/* Using createElement to render a native HTML input in React Native Web */}
            {createElement('input', {
              type: 'date',
              value: dateString,
              onChange: (e) => {
                const newDate = e.target.value ? new Date(e.target.value) : null;
                if (onChangeType === 'start') setStartDate(newDate);
                else setEndDate(newDate);
              },
              style: {
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                color: colors.textPrimary,
                fontSize: '14px',
                fontFamily: 'System',
                width: '100%'
              }
            })}
          </View>
        </View>
      );
    }

    // 2. MOBILE VERSION: Uses TouchableOpacity + Native Modal
    const formattedDate = dateValue ? dateValue.toLocaleDateString() : 'Select Date';
    return (
      <View className="flex-1 mr-2">
        <Text className="text-[10px] uppercase font-bold mb-1" style={{ color: colors.textSecondary }}>{label}</Text>
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={{ borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 8 }}
        >
          <Text style={{ color: dateValue ? colors.textPrimary : '#999' }}>{formattedDate}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={dateValue || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => {
              if (Platform.OS === 'android') setShowPicker(false);
              onDateChange(e, d, onChangeType);
            }}
          />
        )}
      </View>
    );
  };

  // --- RENDERERS ---
  const renderHeader = () => (
    <View className="p-5 rounded-2xl mb-6 border shadow-sm" style={{ backgroundColor: colors.cardBg, borderColor: colors.border, elevation: 2 }}>
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.accent + '20' }}>
          <Ionicons name="person" size={24} color={colors.accent} />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold" style={{ color: colors.header }}>{student.name}</Text>
          <Text className="text-sm font-medium" style={{ color: colors.accent }}>{student.prn || "PRN001"}</Text>
        </View>
      </View>
      <View className="h-[1px] w-full mb-4 opacity-20" style={{ backgroundColor: colors.textSecondary }} />
      <View className="flex-row justify-between">
        <View className="flex-1">
          <Text className="text-[10px] uppercase font-bold mb-1 opacity-60" style={{ color: colors.textSecondary }}>Department</Text>
          <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{student.department || "N/A"}</Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-[10px] uppercase font-bold mb-1 opacity-60" style={{ color: colors.textSecondary }}>Class Batch</Text>
          <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{className || "N/A"}</Text>
        </View>
      </View>
    </View>
  );

  const renderFilterSection = () => (
    <View className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-bold" style={{ color: colors.textPrimary }}>Search & Filter</Text>
        <TouchableOpacity onPress={() => setIsFilterVisible(!isFilterVisible)}>
          <Ionicons name={isFilterVisible ? "chevron-up" : "funnel-outline"} size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Search Bar - Always Visible */}
      <View className="mb-3">
        <TextInput
          className="px-4 py-3 rounded-xl border"
          style={{
            backgroundColor: colors.backgroundColors?.[0] || '#fff',
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
          placeholder="Search by event, location, or NGO..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isFilterVisible && (
        <View>
          <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>DATE RANGE</Text>
          <View className="flex-row justify-between mb-4">
            <DateInputBox
              label="From Date"
              dateValue={startDate}
              showPicker={showStartPicker}
              setShowPicker={setShowStartPicker}
              onChangeType="start"
            />
            <DateInputBox
              label="To Date"
              dateValue={endDate}
              showPicker={showEndPicker}
              setShowPicker={setShowEndPicker}
              onChangeType="end"
            />
          </View>
          <TouchableOpacity
            onPress={clearFilter}
            className="py-2 rounded-lg items-center border"
            style={{ borderColor: colors.border }}
          >
            <Text className="font-bold text-xs" style={{ color: colors.textSecondary }}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderViewToggle = () => (
    <View className="flex-row mb-6 p-1 rounded-xl" style={{ backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border }}>
      <TouchableOpacity onPress={() => setViewMode('card')} className="flex-1 flex-row items-center justify-center py-2 rounded-lg" style={{ backgroundColor: viewMode === 'card' ? colors.accent : 'transparent' }}>
        <Ionicons name="grid" size={16} color={viewMode === 'card' ? '#fff' : colors.textSecondary} />
        <Text className="ml-2 font-bold" style={{ color: viewMode === 'card' ? '#fff' : colors.textSecondary }}>Cards</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setViewMode('table')} className="flex-1 flex-row items-center justify-center py-2 rounded-lg" style={{ backgroundColor: viewMode === 'table' ? colors.accent : 'transparent' }}>
        <Ionicons name="list" size={16} color={viewMode === 'table' ? '#fff' : colors.textSecondary} />
        <Text className="ml-2 font-bold" style={{ color: viewMode === 'table' ? '#fff' : colors.textSecondary }}>Table</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTableHeader = () => (
    <View className="flex-row p-2 rounded-t-lg" style={{ backgroundColor: colors.accent }}>
      <Text className="font-bold text-white text-center text-[9px] px-0.5" style={{ flex: 1.1 }}>Event</Text>
      <Text className="font-bold text-white text-center text-[9px] px-0.5" style={{ flex: 1 }}>Venue</Text>
      <Text className="font-bold text-white text-center text-[9px] px-0.5" style={{ flex: 0.9 }}>NGO</Text>
      <Text className="font-bold text-white text-center text-[9px] px-0.5" style={{ flex: 1 }}>E-Date</Text>
      <Text className="font-bold text-white text-center text-[9px] px-0.5" style={{ flex: 1 }}>Status</Text>
    </View>
  );

  const renderTableRow = (item, index) => {
    const statusColor = item.status === 'Present' ? '#10b981' : (item.status === 'Absent' ? '#ef4444' : '#f59e0b');
    return (
      <View key={index} className="flex-row p-2 border-b border-l border-r" style={{
        backgroundColor: index % 2 === 0 ? colors.cardBg : (colors.backgroundColors?.[1] || '#f9f9f9'),
        borderColor: colors.border,
        alignItems: 'center'
      }}>
        <Text className="text-center text-[9px]" style={{ color: colors.textPrimary, flex: 1.1 }}>{item.eventName}</Text>
        <Text className="text-center text-[9px]" style={{ color: colors.textSecondary, flex: 1 }}>{item.eventLocation}</Text>
        <Text className="text-center text-[9px]" style={{ color: colors.textSecondary, flex: 0.9 }}>{item.ngoName}</Text>
        <Text className="text-center text-[9px]" style={{ color: colors.textSecondary, flex: 1 }}>{item.eventDate}</Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#fff', backgroundColor: statusColor, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' }}>
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  const renderEventCard = (item, index) => {
    const statusColor = item.status === 'Present' ? '#10b981' : (item.status === 'Absent' ? '#ef4444' : '#f59e0b');
    const borderColor = item.status === 'Present' ? '#10b981' : (item.status === 'Absent' ? '#ef4444' : '#f59e0b');
    return (
      <View key={index} className="mb-4 p-5 rounded-2xl border-l-4 border shadow-sm" style={{ backgroundColor: colors.cardBg, borderLeftColor: borderColor, borderColor: colors.border, elevation: 2 }}>
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>{item.eventName}</Text>
            <Text className="text-sm font-medium mt-1" style={{ color: colors.textSecondary }}>{item.eventLocation}</Text>
          </View>
          {/* Status Badge */}
          <View style={{ backgroundColor: statusColor, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>{item.status}</Text>
          </View>
        </View>
        <View className="h-[1px] w-full my-3 opacity-10" style={{ backgroundColor: colors.textSecondary }} />
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] uppercase font-bold opacity-50" style={{ color: colors.textSecondary }}>Event Date</Text>
            <Text className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{item.eventDate}</Text>
          </View>
          <View>
            <Text className="text-[10px] uppercase font-bold opacity-50" style={{ color: colors.textSecondary }}>NGO</Text>
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{item.ngoName}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#F8FAFC' }}>
      {/* Fixed Header with Back Button */}
      <View className="px-5 pt-8 pb-3" style={{ backgroundColor: colors.cardBg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity
          className="flex-row items-center py-2 px-4 rounded-xl border self-start"
          onPress={() => goBack()}
          style={{ borderColor: colors.border, backgroundColor: colors.backgroundColors?.[0] || '#fff' }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
          <Text className="ml-2 font-semibold" style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderFilterSection()}

        {/* --- ATTENDANCE ANALYTICS --- */}
        {!loading && filteredEvents.length > 0 && (
          <View className="flex-row justify-between p-4 rounded-xl mb-6 border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
            <View className="items-center flex-1">
              <Text className="text-[10px] uppercase font-bold" style={{ color: '#10b981' }}>Present</Text>
              <Text className="text-xl font-bold" style={{ color: '#10b981' }}>
                {filteredEvents.filter(e => e.status === 'Present').length}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border, height: '100%', marginHorizontal: 10 }} />
            <View className="items-center flex-1">
              <Text className="text-[10px] uppercase font-bold" style={{ color: '#ef4444' }}>Absent</Text>
              <Text className="text-xl font-bold" style={{ color: '#ef4444' }}>
                {filteredEvents.filter(e => e.status === 'Absent').length}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border, height: '100%', marginHorizontal: 10 }} />
            <View className="items-center flex-1">
              <Text className="text-[10px] uppercase font-bold" style={{ color: '#f59e0b' }}>Registered</Text>
              <Text className="text-xl font-bold" style={{ color: '#f59e0b' }}>
                {filteredEvents.filter(e => e.status === 'Registered').length}
              </Text>
            </View>
          </View>
        )}

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>Activity History</Text>
          <Text className="text-xs font-medium opacity-60" style={{ color: colors.textSecondary }}>{filteredEvents.length} Events Found</Text>
        </View>
        {renderViewToggle()}

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-4 text-xs" style={{ color: colors.textSecondary }}>Loading event history...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View className="items-center justify-center py-10 opacity-60">
            <Text className="text-lg font-medium" style={{ color: colors.textSecondary }}>No events found for this student.</Text>
          </View>
        ) : (
          <View>
            {viewMode === 'table' ? (
              <View className="w-full">
                {renderTableHeader()}
                {filteredEvents.map((event, index) => renderTableRow(event, index))}
              </View>
            ) : (
              filteredEvents.map((event, index) => renderEventCard(event, index))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}