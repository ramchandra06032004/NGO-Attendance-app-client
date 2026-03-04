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

export default function StudentDashboardScreen({ student: loggedStudent }) {
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
            console.log("=== REGISTRATION START ===");
            console.log("Event ID:", event._id);
            console.log("Access Token:", accessToken ? "Present" : "Missing");
            console.log("API Endpoint:", api.studentRegisterEventAPI);

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

            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Registration failed - Error data:", errorData);
                throw new Error(errorData.message || "Registration failed");
            }

            const data = await response.json();
            console.log("Registration successful - Response data:", data);
            Alert.alert("Success", "Successfully registered for event!");
            fetchEvents(); // Refresh the list
        } catch (error) {
            console.error("=== REGISTRATION ERROR ===");
            console.error("Error type:", error.name);
            console.error("Error message:", error.message);
            console.error("Full error:", error);
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
            const eventDate = event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "";
            const matchesSearch = (
                event.aim?.toLowerCase().includes(query) ||
                event.location?.toLowerCase().includes(query) ||
                event.description?.toLowerCase().includes(query) ||
                event.createdBy?.name?.toLowerCase().includes(query) ||
                eventDate.toLowerCase().includes(query)
            );
            if (!matchesSearch) return false;
        }

        // Date range filter
        if (startDate || endDate) {
            const eventDate = event.eventDate ? new Date(event.eventDate) : null;
            if (!eventDate) return false;

            eventDate.setHours(0, 0, 0, 0);

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (eventDate < start) return false;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(0, 0, 0, 0);
                if (eventDate > end) return false;
            }
        }

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
            className="flex-1 px-5 pt-8"
            style={{
                backgroundColor:
                    (colors.backgroundColors && colors.backgroundColors[0]) || "#eef2ff",
            }}
        >
            {/* Header Card */}
            <View className="mb-4 p-4 rounded-xl border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text className="text-lg font-bold" style={{ color: colors.header }}>
                            Welcome, {loggedStudent?.name || "Student"}
                        </Text>
                        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            PRN: {loggedStudent?.prn || "N/A"}
                        </Text>
                    </View>
                    <TouchableOpacity
                        className="px-3 py-1.5 rounded-full border ml-2"
                        style={{ borderColor: colors.error || "#ef4444", borderWidth: 1 }}
                        onPress={handleLogout}
                    >
                        <Text className="text-xs font-bold" style={{ color: colors.error || "#ef4444" }}>
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Title & My Events Button */}
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-2xl font-extrabold" style={{ color: colors.header }}>
                    Upcoming Events
                </Text>
                <TouchableOpacity
                    className="px-4 py-2 rounded-xl flex-row items-center"
                    style={{ backgroundColor: colors.accent }}
                    onPress={() => navigate("StudentMyEvents", { student: loggedStudent })}
                >
                    <Calendar size={16} color="white" style={{ marginRight: 6 }} />
                    <Text className="text-white font-bold text-sm">My Events</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="mb-3">
                <TextInput
                    className="px-4 py-3 rounded-xl border"
                    style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                    }}
                    placeholder="Search by name, location, NGO..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Date Range Picker */}
            <View className="mb-4">
                <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    Filter by Date Range
                </Text>
                <View className="flex-row gap-2">
                    {/* Start Date */}
                    {Platform.OS === 'web' ? (
                        <View className="flex-1">
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
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    border: `1px solid ${colors.border}`,
                                    backgroundColor: colors.cardBg,
                                    color: colors.textPrimary,
                                    fontSize: '14px',
                                    width: '100%',
                                    fontFamily: 'inherit',
                                }}
                            />
                        </View>
                    ) : (
                        <TouchableOpacity
                            className="flex-1 px-3 py-2.5 rounded-xl border flex-row items-center justify-between"
                            style={{
                                backgroundColor: colors.cardBg,
                                borderColor: colors.border,
                            }}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Text className="text-sm" style={{ color: startDate ? colors.textPrimary : colors.textSecondary }}>
                                {formatDate(startDate)}
                            </Text>
                            <Text style={{ color: colors.textSecondary }}>📅</Text>
                        </TouchableOpacity>
                    )}

                    {/* End Date */}
                    {Platform.OS === 'web' ? (
                        <View className="flex-1">
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
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    border: `1px solid ${colors.border}`,
                                    backgroundColor: colors.cardBg,
                                    color: colors.textPrimary,
                                    fontSize: '14px',
                                    width: '100%',
                                    fontFamily: 'inherit',
                                }}
                            />
                        </View>
                    ) : (
                        <TouchableOpacity
                            className="flex-1 px-3 py-2.5 rounded-xl border flex-row items-center justify-between"
                            style={{
                                backgroundColor: colors.cardBg,
                                borderColor: colors.border,
                            }}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Text className="text-sm" style={{ color: endDate ? colors.textPrimary : colors.textSecondary }}>
                                {formatDate(endDate)}
                            </Text>
                            <Text style={{ color: colors.textSecondary }}>📅</Text>
                        </TouchableOpacity>
                    )}

                    {/* Clear Button */}
                    {(startDate || endDate) && (
                        <TouchableOpacity
                            className="px-3 py-2.5 rounded-xl border"
                            style={{
                                backgroundColor: colors.error || "#ef4444",
                                borderColor: colors.error || "#ef4444",
                            }}
                            onPress={clearDateRange}
                        >
                            <Text className="text-white font-bold text-sm">✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Date Pickers - Only for Mobile */}
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
                            {/* Event Title */}
                            <Text
                                className="text-lg font-bold mb-1"
                                style={{ color: colors.textPrimary }}
                            >
                                {item.aim}
                            </Text>

                            {/* NGO Name */}
                            {item.createdBy && (
                                <Text
                                    className="text-xs font-semibold mb-2"
                                    style={{ color: colors.accent }}
                                >
                                    by {item.createdBy.name}
                                </Text>
                            )}

                            {/* Location */}
                            <View className="flex-row items-center mb-2 opacity-90">
                                <Text style={{ fontSize: 13, marginRight: 4 }}>📍</Text>
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: colors.textSecondary }}
                                >
                                    {item.location}
                                </Text>
                            </View>

                            {/* Date Badge */}
                            <View
                                className="self-start px-2 py-1 rounded-md mb-2"
                                style={{ backgroundColor: colors.iconBg }}
                            >
                                <Text
                                    className="text-xs font-bold"
                                    style={{ color: colors.textPrimary }}
                                >
                                    📅 {new Date(item.eventDate).toLocaleDateString()}
                                </Text>
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
                                className="py-2 rounded-lg items-center"
                                style={{ backgroundColor: colors.accent }}
                                onPress={() => {
                                    console.log("Register button pressed for event:", item._id);
                                    // Direct registration without confirmation dialog for web compatibility
                                    handleRegisterForEvent(item);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text className="text-white font-semibold text-xs">
                                    Register
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}
