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
import { ChevronLeft, CheckCircle, Clock, XCircle } from "lucide-react-native";

export default function StudentMyEventsScreen({ student }) {
    const { goBack } = useContext(NavigationContext);
    const { accessToken } = useContext(AuthContext);
    const { darkMode, lightTheme, darkTheme } = useTheme();
    const colors = darkMode ? darkTheme : lightTheme;
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

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

    // --- Score Calculation ---
    const score = useMemo(() => {
        const attended = events.filter(e => e.status === 'Attended').length;
        return attended * 10;
    }, [events]);

    const maxScore = useMemo(() => {
        const pastEvents = events.filter(e => e.status === 'Attended' || isMissed(e)).length;
        return pastEvents > 0 ? pastEvents * 10 : 10;
    }, [events]);

    // Grade is based on attendance ratio: attended / (attended + missed)
    const attendanceRatio = useMemo(() => {
        const attended = events.filter(e => e.status === 'Attended').length;
        const missed = events.filter(e => isMissed(e)).length;
        const total = attended + missed;
        return total > 0 ? (attended / total) * 100 : null; // null = no past events yet
    }, [events]);

    const getGrade = (ratio) => {
        if (ratio === null) return { label: 'No Data', color: '#94a3b8', icon: '➖' };
        if (ratio >= 80) return { label: 'Excellent', color: '#10b981', icon: '🌟' };
        if (ratio >= 60) return { label: 'Good', color: '#3b82f6', icon: '✅' };
        if (ratio >= 40) return { label: 'Average', color: '#f59e0b', icon: '⚠️' };
        return { label: 'Poor', color: '#ef4444', icon: '❌' };
    };

    const grade = getGrade(attendanceRatio);
    const scorePct = Math.min(100, maxScore > 0 ? (score / maxScore) * 100 : 0);

    return (
        <View
            className="flex-1 px-5 pt-8"
            style={{
                backgroundColor:
                    (colors.backgroundColors && colors.backgroundColors[0]) || "#eef2ff",
            }}
        >
            {/* Header */}
            <View className="flex-row items-center mb-4">
                <TouchableOpacity
                    onPress={goBack}
                    className="p-2 rounded-full mr-3 border"
                    style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
                >
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text className="text-2xl font-extrabold" style={{ color: colors.header }}>
                    My Events
                </Text>
            </View>

            {/* Stats Card */}
            {!loading && events.length > 0 && (
                <View className="mb-4 p-4 rounded-xl border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                    {/* Counts row */}
                    <View className="flex-row justify-around mb-4">
                        <View className="items-center">
                            <Text className="text-2xl font-bold" style={{ color: colors.accent }}>
                                {events.length}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                Total
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold" style={{ color: "#10b981" }}>
                                {events.filter(e => e.status === "Attended").length}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                Attended
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                                {events.filter(e => isMissed(e)).length}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                Absent
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
                                {events.filter(e => e.status === "Registered" && !isMissed(e)).length}
                            </Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>
                                Upcoming
                            </Text>
                        </View>
                    </View>

                    {/* Score Section */}
                    <View style={{ backgroundColor: grade.color + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: grade.color + '40' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: colors.textSecondary }}>My Score</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: grade.color + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
                                <Text style={{ fontSize: 11, marginRight: 3 }}>{grade.icon}</Text>
                                <Text style={{ fontSize: 11, fontWeight: 'bold', color: grade.color }}>{grade.label}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
                            <Text style={{ fontSize: 26, fontWeight: '900', color: grade.color, lineHeight: 30 }}>{score}</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4, marginBottom: 2 }}>/ {maxScore} pts</Text>
                        </View>
                        {/* Progress bar */}
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${scorePct}%`, backgroundColor: grade.color, borderRadius: 3 }} />
                        </View>
                        <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: 4, opacity: 0.7 }}>Grade based on attendance ratio (attended ÷ past events)</Text>
                    </View>
                </View>
            )}

            {/* Search Bar */}
            <View className="mb-4">
                <TextInput
                    className="px-4 py-3 rounded-xl border"
                    style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                    }}
                    placeholder="Search events..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

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
                        const missed = isMissed(item);
                        const StatusIcon = getStatusIcon(item.status, missed);
                        const statusColor = getStatusColor(item.status, missed);

                        return (
                            <View
                                className="p-4 rounded-2xl mb-4 border shadow-sm"
                                style={{
                                    backgroundColor: colors.cardBg,
                                    borderColor: colors.border,
                                    elevation: 2,
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
                                            {missed ? "Absent" : item.status}
                                        </Text>
                                    </View>
                                    {item.attendanceMarkedAt && (
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

                                    {/* SPOC Info (Left Column) */}
                                    {item.spocName && (
                                        <View className="mt-1">
                                            <View className="flex-row items-center mb-0.5">
                                                <Text className="text-[11px] font-bold mr-1" style={{ color: colors.accent }}>Manager:</Text>
                                                <Text className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>{item.spocName}</Text>
                                            </View>
                                            {item.spocContact && (
                                                <View className="flex-row items-center">
                                                    <Text className="text-[11px] font-bold mr-1" style={{ color: colors.accent }}>Contact:</Text>
                                                    <Text className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>{item.spocContact}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
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
                                    className="text-sm leading-5"
                                    numberOfLines={2}
                                    style={{ color: colors.textSecondary }}
                                >
                                    {item.description}
                                </Text>

                                {/* Missed Event Banner */}
                                {missed && (
                                    <View
                                        className="flex-row items-center mt-3 px-3 py-2 rounded-xl"
                                        style={{ backgroundColor: "#ef444415", borderLeftWidth: 3, borderLeftColor: "#ef4444" }}
                                    >
                                        {/* <Text style={{ fontSize: 16, marginRight: 6 }}>😔</Text> */}
                                        <Text className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                                            You missed this event!
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
}
