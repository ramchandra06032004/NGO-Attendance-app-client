import React, { useContext, useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Platform,
    Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "../../context/AuthContext";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";
import { Calendar, LogOut } from "lucide-react-native";
import AnimatedSearch from "../../components/AnimatedSearch";
import CollapsibleFilter from "../../components/CollapsibleFilter";

export default function StudentDashboardScreen({ student: loggedStudent, isTab }) {
    const { navigate } = useContext(NavigationContext);
    const { darkMode, lightTheme, darkTheme } = useTheme();
    const colors = darkMode ? darkTheme : lightTheme;
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const { logout, accessToken } = useContext(AuthContext);

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate("Home");
    };

    const fetchEvents = async () => {
        try {
            console.log("Fetching events with token:", accessToken ? "Token present" : "No token");
            const response = await fetch(api.studentEventsAPI, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                console.error("Fetch events failed:", response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Events fetched:", data.data?.events?.length || 0);
            setEvents(data.data?.events || []);
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error fetching events:", error);
            setLoading(false);
            setRefreshing(false);
            Alert.alert("Error", "Failed to fetch events");
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const handleRegisterForEvent = async (event) => {
        try {
            const response = await fetch(api.studentRegisterEventAPI, {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ eventId: event._id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Registration failed");
            }

            Alert.alert("Success", "Successfully registered for event!");
            fetchEvents(); // Refresh the list
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to register for event");
        }
    };

    // Filter events based on search query and date range
    const filteredEvents = events.filter((event) => {
        // Hide past events — only show today and upcoming
        if (event.eventDate) {
            const eventDate = new Date(event.eventDate);
            eventDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (eventDate < today) return false;
        }

        // Text search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const eventDateRange = `${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}`;
            const matchesSearch = (
                event.aim?.toLowerCase().includes(query) ||
                event.location?.toLowerCase().includes(query) ||
                event.description?.toLowerCase().includes(query) ||
                event.createdBy?.name?.toLowerCase().includes(query) ||
                event.spocName?.toLowerCase().includes(query) ||
                eventDateRange.toLowerCase().includes(query)
            );
            if (!matchesSearch) return false;
        }

        // Date range filter
        if (startDate || endDate) {
            const eventStart = event.startDate ? new Date(event.startDate) : new Date(event.eventDate);
            const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
            eventStart.setHours(0, 0, 0, 0);
            eventEnd.setHours(0, 0, 0, 0);

            const filterStart = startDate ? new Date(startDate) : null;
            if (filterStart) filterStart.setHours(0, 0, 0, 0);
            const filterEnd = endDate ? new Date(endDate) : null;
            if (filterEnd) filterEnd.setHours(0, 0, 0, 0);

            if (filterStart && eventEnd < filterStart) return false;
            if (filterEnd && eventStart > filterEnd) return false;
        }

        // Exclude registered events from Explore
        if (event.isRegistered) return false;

        return true;
    });

    const clearDateRange = () => {
        setStartDate(null);
        setEndDate(null);
    };

    const formatDate = (date) => {
        if (!date) return "Select Date";
        return new Date(date).toLocaleDateString();
    };

    return (
        <View
            className={`flex-1 px-5 ${isTab ? "pt-2" : "pt-8"}`}
            style={{
                backgroundColor:
                    (colors.backgroundColors && colors.backgroundColors[0]) || "#eef2ff",
            }}
        >
            {/* Title + Search Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.header, flex: 1 }}>
                    Explore Events
                </Text>
                <AnimatedSearch
                    placeholder="Search events..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    colors={colors}
                    containerStyle={{ marginBottom: 0 }}
                />
            </View>

            {/* Collapsible Date Filter */}
            <CollapsibleFilter colors={colors} title="Filter by Date" containerStyle={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    {/* Start Date */}
                    {Platform.OS === 'web' ? (
                        <View style={{ flex: 1 }}>
                            <input
                                type="date"
                                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setStartDate(new Date(e.target.value));
                                    } else {
                                        setStartDate(null);
                                    }
                                }}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    border: `1px solid ${colors.border}`,
                                    backgroundColor: colors.cardBg,
                                    color: colors.textPrimary,
                                    fontSize: '13px',
                                    width: '100%',
                                    fontFamily: 'inherit',
                                }}
                            />
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                borderRadius: 10,
                                borderWidth: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: colors.cardBg,
                                borderColor: colors.border,
                            }}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Text style={{ fontSize: 12, color: startDate ? colors.textPrimary : colors.textSecondary }}>
                                {formatDate(startDate)}
                            </Text>
                            <Text style={{ color: colors.textSecondary }}>📅</Text>
                        </TouchableOpacity>
                    )}

                    {/* End Date */}
                    {Platform.OS === 'web' ? (
                        <View style={{ flex: 1 }}>
                            <input
                                type="date"
                                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setEndDate(new Date(e.target.value));
                                    } else {
                                        setEndDate(null);
                                    }
                                }}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    border: `1px solid ${colors.border}`,
                                    backgroundColor: colors.cardBg,
                                    color: colors.textPrimary,
                                    fontSize: '13px',
                                    width: '100%',
                                    fontFamily: 'inherit',
                                }}
                            />
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                borderRadius: 10,
                                borderWidth: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: colors.cardBg,
                                borderColor: colors.border,
                            }}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Text style={{ fontSize: 12, color: endDate ? colors.textPrimary : colors.textSecondary }}>
                                {formatDate(endDate)}
                            </Text>
                            <Text style={{ color: colors.textSecondary }}>📅</Text>
                        </TouchableOpacity>
                    )}

                    {/* Clear Button */}
                    {(startDate || endDate) && (
                        <TouchableOpacity
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                borderRadius: 10,
                                backgroundColor: '#ef4444',
                            }}
                            onPress={clearDateRange}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </CollapsibleFilter>

            {/* Mobile Date Pickers */}
            {Platform.OS !== 'web' && showStartPicker && (
                <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                        setShowStartPicker(Platform.OS === "ios");
                        if (selectedDate) {
                            setStartDate(selectedDate);
                        }
                    }}
                />
            )}

            {Platform.OS !== 'web' && showEndPicker && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                        setShowEndPicker(Platform.OS === "ios");
                        if (selectedDate) {
                            setEndDate(selectedDate);
                        }
                    }}
                />
            )}

            {/* Event List */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : events.length === 0 ? (
                <View className="flex-1 justify-center items-center opacity-60">
                    <Text className="text-base" style={{ color: colors.textSecondary }}>
                        No events available at the moment.
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
                    renderItem={({ item }) => (
                        <View
                            className="p-4 rounded-2xl mb-4 border shadow-sm"
                            style={{
                                backgroundColor: colors.cardBg,
                                borderColor: colors.border,
                                elevation: 2,
                            }}
                        >
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
                                className="text-sm leading-5 mb-3"
                                numberOfLines={2}
                                style={{ color: colors.textSecondary }}
                            >
                                {item.description}
                            </Text>

                            {/* Register Button */}
                            <TouchableOpacity
                                className="py-2 rounded-lg items-center flex-row justify-center"
                                style={{ backgroundColor: item.isRegistered ? "#eab308" : colors.accent }}
                                onPress={() => {
                                    if (!item.isRegistered) {
                                        console.log("Register button pressed for event:", item._id);
                                        // Direct registration without confirmation dialog for web compatibility
                                        handleRegisterForEvent(item);
                                    }
                                }}
                                activeOpacity={item.isRegistered ? 1 : 0.7}
                            >
                                <Text className="text-white font-semibold text-xs">
                                    {item.isRegistered ? "✓ Registered" : "Register"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}
