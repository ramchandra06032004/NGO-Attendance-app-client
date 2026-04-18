import React, { useContext, useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Alert,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";
import { ChevronLeft, CheckCircle, Clock, XCircle, Search } from "lucide-react-native";
import AnimatedSearch from "../../components/AnimatedSearch";

// ── Date helpers ──────────────────────────────────────────────────────────────
function toDateString(date) {
  if (!date) return null;
  // If it's already a ISO-like date string (YYYY-MM-DD), just return the date part
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.split('T')[0];
  }
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function getEventDates(startDate, endDate) {
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const end = new Date(endDate || startDate); end.setHours(0, 0, 0, 0);
  const dates = [];
  const cur = new Date(start);
  while (cur <= end) { dates.push(toDateString(cur)); cur.setDate(cur.getDate() + 1); }
  return dates;
}
const isDatePast = (dateStr) => {
  if (!dateStr) return false;
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return targetDate < today;
};
// ─────────────────────────────────────────────────────────────────────────────

export default function StudentMyEventsScreen({ student }) {
    const { goBack } = useContext(NavigationContext);
    const { accessToken } = useContext(AuthContext);
    const { darkMode, lightTheme, darkTheme } = useTheme();
    const colors = darkMode ? darkTheme : lightTheme;
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [expandedEvents, setExpandedEvents] = useState(new Set());

    const toggleExpand = (eventId) => {
        const newSet = new Set(expandedEvents);
        if (newSet.has(eventId)) newSet.delete(eventId);
        else newSet.add(eventId);
        setExpandedEvents(newSet);
    };

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const response = await fetch(api.studentMyEventsAPI, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setEvents(data.data?.events || []);
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error fetching my events:", error);
            setLoading(false);
            setRefreshing(false);
            Alert.alert("Error", "Failed to fetch your events");
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyEvents();
    };

    // Filter events based on search query
    const filteredEvents = events.filter((event) => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const eventDateRange = `${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`;
            const matchesSearch = (
                event.aim?.toLowerCase().includes(query) ||
                event.location?.toLowerCase().includes(query) ||
                event.description?.toLowerCase().includes(query) ||
                event.status?.toLowerCase().includes(query) ||
                event.spocName?.toLowerCase().includes(query) ||
                eventDateRange.toLowerCase().includes(query)
            );
            return matchesSearch;
        }
        return true;
    });

    // Returns true when the student registered but the event date has already passed
    const isMissed = (event) => {
        if (event.status !== "Registered") return false;
        const dateToCheck = event.endDate || event.startDate || event.eventDate;
        if (!dateToCheck) return false;
        const eventDate = new Date(dateToCheck);
        eventDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate < today;
    };

    const getStatusColor = (status, missed) => {
        if (missed) return "#ef4444"; // red for absent
        return status === "Attended" ? "#10b981" : "#f59e0b";
    };

    const getStatusIcon = (status, missed) => {
        if (missed) return XCircle;
        return status === "Attended" ? CheckCircle : Clock;
    };

    const getGrade = (ratio) => {
        if (ratio === null) return { label: 'No Data', color: '#94a3b8', icon: '➖' };
        if (ratio >= 80) return { label: 'Excellent', color: '#10b981', icon: '🌟' };
        if (ratio >= 60) return { label: 'Good', color: '#3b82f6', icon: '✅' };
        if (ratio >= 40) return { label: 'Average', color: '#f59e0b', icon: '⚠️' };
        return { label: 'Poor', color: '#ef4444', icon: '❌' };
    };

    // --- Attendance Stats Calculation (Strictly Day-Based) ---
    const attendanceStats = useMemo(() => {
        let totalDays = 0;
        let presentDays = 0;
        let absentDays = 0;
        let upcomingDays = 0;
        let pastDaysCount = 0;

        events.forEach(event => {
            const days = getEventDates(event.startDate || event.eventDate, event.endDate || event.startDate || event.eventDate);
            
            days.forEach(day => {
                totalDays++;
                const wasPresent = event.attendanceRecords?.some(r => r.attendanceDate === day);
                const isPast = isDatePast(day);

                if (wasPresent) {
                    presentDays++;
                    pastDaysCount++;
                } else if (isPast) {
                    absentDays++;
                    pastDaysCount++;
                } else {
                    upcomingDays++;
                }
            });

            // Fallback for legacy "Attended" events that might be missing specific day records
            const daysFoundPresent = days.filter(d => event.attendanceRecords?.some(r => r.attendanceDate === d)).length;
            if (event.status === "Attended" && daysFoundPresent === 0 && days.length > 0) {
                // Count at least 1 day as present for legacy single-day events
                presentDays++;
                if (days.length === 1) {
                    // It was a single day event, so we replace the absent/upcoming with present
                    if (isDatePast(days[0])) {
                        absentDays = Math.max(0, absentDays - 1);
                    } else {
                        upcomingDays = Math.max(0, upcomingDays - 1);
                    }
                    pastDaysCount++;
                }
            }
        });

        const ratio = pastDaysCount > 0 ? (presentDays / pastDaysCount) * 100 : null;
        return { totalDays, presentDays, absentDays, upcomingDays, pastDaysCount, ratio };
    }, [events]);

    const grade = getGrade(attendanceStats.ratio);
    const scorePct = Math.round(attendanceStats.ratio || 0);

    const renderBreakdown = (event) => {
        const days = getEventDates(event.startDate || event.eventDate, event.endDate || event.startDate || event.eventDate);
        return (
            <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.iconBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                    Attendance Breakdown
                </Text>
                {days.map((day, idx) => {
                    const record = event.attendanceRecords?.find(r => r.attendanceDate === day);
                    const isPast = isDatePast(day);
                    const status = record ? "Present" : (isPast ? "Absent" : "Upcoming");
                    const color = record ? "#10b981" : (isPast ? "#ef4444" : colors.textSecondary);
                    
                    return (
                        <View key={day} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border + '50' }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>{formatDateLabel(day)}</Text>
                                {record && (
                                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>
                                        🕒 {new Date(record.attendanceMarkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                )}
                            </View>
                            <View style={{ backgroundColor: color + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: color + '30' }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: color, textTransform: 'uppercase' }}>{status}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <View
            className="flex-1 px-5 pt-8"
            style={{
                backgroundColor:
                    (colors.backgroundColors && colors.backgroundColors[0]) || "#eef2ff",
            }}
        >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4" style={{ zIndex: 10 }}>
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        onPress={goBack}
                        className="p-2 rounded-full mr-3 border"
                        style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
                    >
                        <ChevronLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text className="text-xl font-extrabold" style={{ color: colors.header }}>
                        My Events
                    </Text>
                </View>

                <AnimatedSearch
                    placeholder="Search..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    colors={colors}
                    containerStyle={{ marginBottom: 0 }}
                />
            </View>

            {/* Stats Card */}
            {!loading && events.length > 0 && (
                <View className="mb-4 p-4 rounded-xl border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                    {/* Counts row */}
                    <View className="flex-row justify-around mb-4">
                        <View className="items-center">
                            <Text className="text-2xl font-bold" style={{ color: colors.accent }}>
                                {attendanceStats.totalDays}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                Total
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold" style={{ color: "#10b981" }}>
                                {attendanceStats.presentDays}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                Attended
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                                {attendanceStats.absentDays}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                Absent
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
                                {attendanceStats.upcomingDays}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                Upcoming
                            </Text>
                        </View>
                    </View>

                    {/* Score Section */}
                    <View style={{ backgroundColor: grade.color + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: grade.color + '40' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: colors.textSecondary }}>My Attendance</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: grade.color + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
                                <Text style={{ fontSize: 11, marginRight: 3 }}>{grade.icon}</Text>
                                <Text style={{ fontSize: 11, fontWeight: 'bold', color: grade.color }}>{grade.label}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
                            <Text style={{ fontSize: 26, fontWeight: '900', color: grade.color, lineHeight: 30 }}>{scorePct}%</Text>
                            <Text style={{ fontSize: 10, color: colors.textSecondary, marginLeft: 6 }}>({attendanceStats.presentDays} attended / {attendanceStats.pastDaysCount} past days)</Text>
                        </View>
                        {/* Progress bar */}
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${scorePct}%`, backgroundColor: grade.color, borderRadius: 3 }} />
                        </View>
                        <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: 4, opacity: 0.7 }}>Percentage based on present vs absent states for past days</Text>
                    </View>
                </View>
            )}


            {/* Event List */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : events.length === 0 ? (
                <View className="flex-1 justify-center items-center opacity-60">
                    <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
                        You haven't registered for any events yet.
                    </Text>
                    <Text className="text-sm text-center mt-2" style={{ color: colors.textSecondary }}>
                        Go to the dashboard to browse and register for events!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredEvents}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center py-10">
                            <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
                                No events found matching your search
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const daysList = getEventDates(item.startDate || item.eventDate, item.endDate || item.startDate || item.eventDate);
                        const isMultiDay = daysList.length > 1;
                        
                        // Calculate per-event stats
                        const attendedCount = daysList.filter(d => item.attendanceRecords?.some(r => r.attendanceDate === d)).length;
                        const isPast = daysList.every(d => isDatePast(d));
                        const isFuture = daysList.every(d => !isDatePast(d));
                        
                        // Determine status label and color
                        let statusLabel = item.status;
                        let statusColor = "#f59e0b"; // default orange
                        
                        if (isMultiDay) {
                            statusLabel = `${attendedCount}/${daysList.length} Days`;
                            if (attendedCount === daysList.length) {
                                statusColor = "#10b981"; // Green
                            } else if (attendedCount > 0) {
                                statusColor = "#f59e0b"; // Orange
                            } else if (isDatePast(daysList[0])) {
                                statusColor = "#ef4444"; // Red (started but 0 attendance)
                            } else {
                                statusColor = colors.textSecondary; // Grey (Upcoming)
                            }
                        } else {
                           // Single day fallback
                           const missed = isMissed(item);
                           if (missed) {
                               statusLabel = "Absent";
                               statusColor = "#ef4444";
                           } else if (item.status === "Attended") {
                               statusColor = "#10b981";
                           }
                        }

                        const StatusIcon = item.status === "Attended" || (isMultiDay && attendedCount > 0) ? CheckCircle : (statusColor === "#ef4444" ? XCircle : Clock);
                        const isExpanded = expandedEvents.has(item._id);

                        return (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => isMultiDay && toggleExpand(item._id)}
                                className="p-4 rounded-2xl mb-4 border shadow-sm"
                                style={{
                                    backgroundColor: colors.cardBg,
                                    borderColor: isExpanded ? colors.accent : colors.border,
                                    elevation: isExpanded ? 4 : 2,
                                }}
                            >
                                {/* Status Badge */}
                                <View className="flex-row items-center justify-between mb-2">
                                    <View
                                        className="flex-row items-center px-3 py-1.5 rounded-full"
                                        style={{ backgroundColor: `${statusColor}20` }}
                                    >
                                        <StatusIcon size={14} color={statusColor} style={{ marginRight: 4 }} />
                                        <Text
                                            className="text-xs font-bold"
                                            style={{ color: statusColor }}
                                        >
                                            {statusLabel}
                                        </Text>
                                    </View>
                                    {isMultiDay && (
                                        <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: colors.accent + '15' }}>
                                            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.accent }}>MULTI-DAY</Text>
                                        </View>
                                    )}
                                    {!isMultiDay && item.attendanceMarkedAt && (
                                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                            {new Date(item.attendanceMarkedAt).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>

                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1 pr-3">
                                        <Text
                                            className="text-lg font-bold mb-1"
                                            style={{ color: colors.header || colors.textPrimary }}
                                        >
                                            {item.aim}
                                        </Text>

                                        {item.createdBy && (
                                            <Text
                                                className="text-[11px] font-semibold mb-2"
                                                style={{ color: colors.accent }}
                                            >
                                                by {item.createdBy.name}
                                            </Text>
                                        )}

                                        {/* Location */}
                                        <View className="flex-row items-center mb-1 opacity-90">
                                            <Text style={{ fontSize: 13, marginRight: 4 }}>📍</Text>
                                            <Text
                                                className="text-[13px] font-medium"
                                                style={{ color: colors.textSecondary }}
                                            >
                                                {item.location}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Date & Time Badge (Right Column) */}
                                    <View
                                        className="items-end px-2.5 py-2 rounded-xl"
                                        style={{ backgroundColor: colors.iconBg, minWidth: 100 }}
                                    >
                                        <Text
                                            className="text-[10px] font-bold mb-1 text-right"
                                            style={{ color: colors.textPrimary }}
                                        >
                                            📅 {new Date(item.startDate || item.eventDate).toLocaleDateString()}{item.endDate && item.endDate !== item.startDate ? ` - ${new Date(item.endDate).toLocaleDateString()}` : ''}
                                        </Text>
                                        <Text
                                            className="text-[10px] font-semibold opacity-80 text-right"
                                            style={{ color: colors.textPrimary }}
                                        >
                                            ⏰ Daily: {item.startTime || "N/A"} - {item.endTime || "N/A"}
                                        </Text>
                                    </View>
                                </View>

                                {/* Description Snippet */}
                                <Text
                                    className="text-sm leading-5 mb-3"
                                    numberOfLines={isExpanded ? 0 : 2}
                                    style={{ color: colors.textSecondary }}
                                >
                                    {item.description}
                                </Text>

                                {isMultiDay && (
                                    <TouchableOpacity 
                                        onPress={() => toggleExpand(item._id)}
                                        style={{ 
                                            flexDirection: 'row', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            backgroundColor: colors.accent + '10', 
                                            paddingVertical: 8, 
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: colors.accent + '20',
                                            marginTop: 4
                                        }}
                                    >
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.accent, letterSpacing: 0.5 }}>
                                            {isExpanded ? "CLOSE DETAILS" : "VIEW DAILY BREAKDOWN"}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: colors.accent, marginLeft: 4 }}>
                                            {isExpanded ? "▲" : "▼"}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {isExpanded && isMultiDay && renderBreakdown(item)}

                                {/* Missed Event Banner (Only for single day fallback) */}
                                {missed && !isMultiDay && (
                                    <View
                                        className="flex-row items-center mt-3 px-3 py-2 rounded-xl"
                                        style={{ backgroundColor: "#ef444415", borderLeftWidth: 3, borderLeftColor: "#ef4444" }}
                                    >
                                        <Text className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                                            You missed this event!
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
}
