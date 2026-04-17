import React, { useContext, useEffect, useState, useMemo, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, TextInput, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { studentEventsAPI } from '../../../apis/api';
import AnimatedSearch from '../../components/AnimatedSearch';
import CollapsibleFilter from '../../components/CollapsibleFilter';

export default function StudentEventsScreen({ college, studentId }) {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [allEvents, setAllEvents] = useState([]);
  const [student, setStudent] = useState({ name: 'Student', id: studentId, attendedEvents: [] });
  const [className, setClassName] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [loading, setLoading] = useState(false);
  const { accessToken } = useContext(AuthContext);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile Picker Visibility
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Helper to determine Present / Absent / Registered status
  const getEventStatus = (eventObj, attendanceDateStr) => {
    if (attendanceDateStr && attendanceDateStr !== 'N/A') return 'Present';
    const dateToCheck = eventObj.endDate || eventObj.startDate || eventObj.eventDate;
    if (!dateToCheck) return 'Registered';
    const eventDate = new Date(dateToCheck);
    eventDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today ? 'Absent' : 'Registered';
  };

  // Score calculation (based on all-time events, not filtered view)
  const score = useMemo(() => {
    const present = allEvents.filter(e => e.status === 'Present').length;
    return present * 10;
  }, [allEvents]);

  const maxScore = useMemo(() => {
    const past = allEvents.filter(e => e.status !== 'Registered').length;
    return past > 0 ? past * 10 : 10;
  }, [allEvents]);

  // Grade is based on attendance ratio: present / (present + absent)
  const attendanceRatio = useMemo(() => {
    const present = allEvents.filter(e => e.status === 'Present').length;
    const absent = allEvents.filter(e => e.status === 'Absent').length;
    const total = present + absent;
    return total > 0 ? (present / total) * 100 : null; // null = no past events yet
  }, [allEvents]);

  const getGrade = (ratio) => {
    if (ratio === null) return { label: 'No Data', color: '#94a3b8', icon: '➖' };
    if (ratio >= 80) return { label: 'Excellent', color: '#10b981', icon: '🌟' };
    if (ratio >= 60) return { label: 'Good', color: '#3b82f6', icon: '✅' };
    if (ratio >= 40) return { label: 'Average', color: '#f59e0b', icon: '⚠️' };
    return { label: 'Poor', color: '#ef4444', icon: '❌' };
  };

  const grade = getGrade(attendanceRatio);
  const scorePct = Math.min(100, maxScore > 0 ? (score / maxScore) * 100 : 0);

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
            rawDate: ev.startDate ? new Date(ev.startDate) : (ev.eventDate ? new Date(ev.eventDate) : null),
            startDate: ev.startDate || ev.eventDate,
            endDate: ev.endDate || ev.startDate || ev.eventDate,
            startTime: ev.startTime,
            endTime: ev.endTime,
            spocName: ev.spocName,
            spocContact: ev.spocContact,
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

  // Correctly compute filtered events via useMemo
  const computedFilteredEvents = useMemo(() => {
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

    // Date range filter — properly inside .filter(ev => ...)
    if (startDate || endDate) {
      const filterStart = startDate ? new Date(startDate) : null;
      if (filterStart) filterStart.setHours(0, 0, 0, 0);

      const filterEnd = endDate ? new Date(endDate) : null;
      if (filterEnd) filterEnd.setHours(0, 0, 0, 0);

      filtered = filtered.filter(ev => {
        const eventStart = ev.startDate ? new Date(ev.startDate) : ev.rawDate;
        const eventEnd = ev.endDate ? new Date(ev.endDate) : eventStart;

        if (!eventStart) return true; // can't filter, keep it

        const es = new Date(eventStart); es.setHours(0, 0, 0, 0);
        const ee = eventEnd ? new Date(eventEnd) : es; ee.setHours(0, 0, 0, 0);

        // Overlap: event [es, ee] overlaps filter [filterStart, filterEnd]
        if (filterStart && ee < filterStart) return false;
        if (filterEnd && es > filterEnd) return false;
        return true;
      });
    }

    return filtered;
  }, [searchQuery, startDate, endDate, allEvents]);

  // NO useEffect here — using computedFilteredEvents directly prevents infinite loop


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
      <View className="flex-row justify-between mb-4">
        <View className="flex-1">
          <Text className="text-[10px] uppercase font-bold mb-1 opacity-60" style={{ color: colors.textSecondary }}>Department</Text>
          <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{student.department || "N/A"}</Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-[10px] uppercase font-bold mb-1 opacity-60" style={{ color: colors.textSecondary }}>Class Batch</Text>
          <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{className || "N/A"}</Text>
        </View>
      </View>

      {/* Score Card */}
      {allEvents.length > 0 && (
        <View style={{ backgroundColor: grade.color + '12', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: grade.color + '40' }}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>Attendance Score</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: grade.color + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
              <Text style={{ fontSize: 11, marginRight: 3 }}>{grade.icon}</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: grade.color }}>{grade.label}</Text>
            </View>
          </View>
          <View className="flex-row items-end mb-2">
            <Text style={{ fontSize: 28, fontWeight: '900', color: grade.color, lineHeight: 32 }}>{score}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4, marginBottom: 2 }}>/ {maxScore} pts</Text>
          </View>
          {/* Progress bar */}
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${scorePct}%`, backgroundColor: grade.color, borderRadius: 3 }} />
          </View>
          <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: 4, opacity: 0.7 }}>Grade based on attendance ratio (present ÷ past events)</Text>
        </View>
      )}
    </View>
  );

  const renderFilterSection = () => (
    <CollapsibleFilter colors={colors} title="Filter by Date" containerStyle={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
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
        {(startDate || endDate) && (
          <TouchableOpacity
            onPress={clearFilter}
            style={{
              alignSelf: 'flex-end',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 4,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </CollapsibleFilter>
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
        
        <View className="flex-row justify-between items-start">
          {/* Left Column: NGO & Manager Info */}
          <View className="flex-1 pr-3">
            <View className="mb-2">
              <Text className="text-[10px] uppercase font-bold opacity-50" style={{ color: colors.textSecondary }}>Project NGO</Text>
              <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{item.ngoName}</Text>
            </View>

            {item.spocName && (
              <View>
                <Text className="text-[10px] uppercase font-bold opacity-50" style={{ color: colors.textSecondary }}>Manager</Text>
                <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{item.spocName}</Text>
                {item.spocContact && (
                  <Text className="text-[11px] font-bold mt-0.5" style={{ color: colors.accent }}>📞 {item.spocContact}</Text>
                )}
              </View>
            )}
          </View>

          {/* Right Column: Date & Time Badge */}
          <View
            className="items-end px-3 py-2 rounded-xl"
            style={{ backgroundColor: colors.iconBg || colors.accent + '10', minWidth: 105 }}
          >
            <Text className="text-[10px] uppercase font-bold opacity-50 mb-1" style={{ color: colors.textSecondary }}>Schedule</Text>
            <Text className="text-[10px] font-bold text-right" style={{ color: colors.textPrimary }}>
              📅 {new Date(item.startDate || item.rawDate).toLocaleDateString()}{item.endDate && item.endDate !== item.startDate ? ` - ${new Date(item.endDate).toLocaleDateString()}` : ''}
            </Text>
            <Text className="text-[10px] font-semibold opacity-80 mt-1 text-right" style={{ color: colors.textPrimary }}>
              ⏰ Daily: {item.startTime || "N/A"} - {item.endTime || "N/A"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#F8FAFC' }}>
      {/* Fixed Header with Back Button + Search */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 12,
        backgroundColor: colors.cardBg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => goBack()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundColors?.[0] || '#fff',
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textPrimary} />
          <Text style={{ marginLeft: 6, fontWeight: '600', color: colors.textPrimary, fontSize: 13 }}>Back</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* Animated Search */}
        <AnimatedSearch
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          colors={colors}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderFilterSection()}

        {/* --- ATTENDANCE ANALYTICS --- */}
        {!loading && computedFilteredEvents.length > 0 && (
          <View className="flex-row justify-between p-4 rounded-xl mb-6 border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
            <View className="items-center flex-1">
              <Text className="text-[10px] uppercase font-bold" style={{ color: '#10b981' }}>Present</Text>
              <Text className="text-xl font-bold" style={{ color: '#10b981' }}>
                {computedFilteredEvents.filter(e => e.status === 'Present').length}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border, height: '100%', marginHorizontal: 10 }} />
            <View className="items-center flex-1">
              <Text className="text-[10px] uppercase font-bold" style={{ color: '#ef4444' }}>Absent</Text>
              <Text className="text-xl font-bold" style={{ color: '#ef4444' }}>
                {computedFilteredEvents.filter(e => e.status === 'Absent').length}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border, height: '100%', marginHorizontal: 10 }} />
            <View className="items-center flex-1">
              <Text className="text-[10px] uppercase font-bold" style={{ color: '#f59e0b' }}>Registered</Text>
              <Text className="text-xl font-bold" style={{ color: '#f59e0b' }}>
                {computedFilteredEvents.filter(e => e.status === 'Registered').length}
              </Text>
            </View>
          </View>
        )}

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>Activity History</Text>
          <Text className="text-xs font-medium opacity-60" style={{ color: colors.textSecondary }}>{computedFilteredEvents.length} Events Found</Text>
        </View>
        {renderViewToggle()}

        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-4 text-xs" style={{ color: colors.textSecondary }}>Loading event history...</Text>
          </View>
        ) : computedFilteredEvents.length === 0 ? (
          <View className="items-center justify-center py-10 opacity-60">
            <Text className="text-lg font-medium" style={{ color: colors.textSecondary }}>No events found for this student.</Text>
          </View>
        ) : (
          <View>
            {viewMode === 'table' ? (
              <View className="w-full">
                {renderTableHeader()}
                {computedFilteredEvents.map((event, index) => renderTableRow(event, index))}
              </View>
            ) : (
              computedFilteredEvents.map((event, index) => renderEventCard(event, index))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}