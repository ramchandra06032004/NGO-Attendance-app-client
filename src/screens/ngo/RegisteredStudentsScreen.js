import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Image,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";
import { ChevronLeft, Users } from "lucide-react-native";

export default function RegisteredStudentsScreen({ route }) {
    const { darkMode, lightTheme, darkTheme } = useTheme();
    const colors = darkMode ? darkTheme : lightTheme;
    const { navigate, goBack } = useContext(NavigationContext);
    const { accessToken } = useContext(AuthContext);

    const params = route?.params || {};
    const eventId = params.eventId;
    const eventName = params.eventName || "Event";

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (eventId) {
            fetchRegisteredStudents();
        }
    }, [eventId]);

    const fetchRegisteredStudents = async () => {
        try {
            console.log("Fetching registered students for event:", eventId);
            const response = await fetch(api.ngoRegisteredStudentsAPI(eventId), {
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

            const result = await response.json();
            console.log("Registered students data:", result.data);
            setData(result.data);
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error fetching registered students:", error);
            setLoading(false);
            setRefreshing(false);
            Alert.alert("Error", "Failed to fetch registered students");
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRegisteredStudents();
    };

    const handleMarkAttendance = (college) => {

        // Navigate to StudentsListScreen with registered students
        navigate("StudentsList", {
            eventId: eventId,
            collegeId: college.college._id,
            collegeName: college.college.name,
            registeredStudents: college.students,
        });
    };

    if (loading) {
        return (
            <View
                className="flex-1 justify-center items-center"
                style={{ backgroundColor: colors.backgroundColors[0] }}
            >
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (!data || data.registeredStudents.length === 0) {
        return (
            <View
                className="flex-1 p-5"
                style={{ backgroundColor: colors.backgroundColors[0] }}
            >
                <View className="flex-row items-center mb-6 mt-4">
                    <TouchableOpacity
                        onPress={goBack}
                        className="p-2 rounded-full mr-4 border"
                        style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
                    >
                        <ChevronLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text className="text-2xl font-black" style={{ color: colors.header }}>
                        Registered Students
                    </Text>
                </View>
                <View className="flex-1 justify-center items-center">
                    <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
                        No students have registered for this event yet.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View
            className="flex-1 p-5"
            style={{ backgroundColor: colors.backgroundColors[0] }}
        >
            {/* Header */}
            <View className="flex-row items-center mb-4 mt-4">
                <TouchableOpacity
                    onPress={goBack}
                    className="p-2 rounded-full mr-4 border"
                    style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
                >
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-2xl font-black" style={{ color: colors.header }}>
                        Registered Students
                    </Text>
                    <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        {eventName}
                    </Text>
                </View>
            </View>

            {/* Summary Card */}
            <View
                className="p-4 rounded-xl mb-4 border"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
                <View className="flex-row justify-around">
                    <View className="items-center">
                        <Text className="text-2xl font-bold" style={{ color: colors.accent }}>
                            {data.totalStudents}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            Total Students
                        </Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-2xl font-bold" style={{ color: colors.accent }}>
                            {data.totalColleges}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            Colleges
                        </Text>
                    </View>
                </View>
            </View>

            {/* College List */}
            <FlatList
                data={data.registeredStudents}
                keyExtractor={(item) => item.college._id}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item: college }) => {
                    return (
                        <View
                            className="mb-3 rounded-xl border overflow-hidden"
                            style={{
                                backgroundColor: colors.cardBg,
                                borderColor: colors.border,
                            }}
                        >
                            {/* College Header with Inline Action */}
                            <View className="p-4 flex-row items-center justify-between">
                                <View className="flex-1 flex-row items-center mr-2">
                                    <View
                                        className="w-10 h-10 rounded-full items-center justify-center mr-3 overflow-hidden"
                                        style={{ backgroundColor: colors.accent + '20' }}
                                    >
                                        {college.college.logoUrl ? (
                                            <Image
                                                source={{ uri: college.college.logoUrl }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Users size={20} color={colors.accent} />
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text
                                            className="text-base font-bold"
                                            numberOfLines={1}
                                            style={{ color: colors.textPrimary }}
                                        >
                                            {college.college.name}
                                        </Text>
                                        <Text
                                            className="text-xs mt-0.5"
                                            style={{ color: colors.textSecondary }}
                                        >
                                            {college.studentCount} student{college.studentCount !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                </View>

                                {/* Small Mark Attendance Button */}
                                <TouchableOpacity
                                    className="px-3 py-2 rounded-lg"
                                    style={{ backgroundColor: colors.accent }}
                                    onPress={() => handleMarkAttendance(college)}
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-white font-bold text-xs">
                                        Mark Attendance
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
}
