import React, { useContext, useState, useEffect } from "react";
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
import { NavigationContext } from "../../../context/NavigationContext";
import { AuthContext } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import * as api from "../../../../apis/api";
import {
  ChevronLeft,
  CheckCircle,
  Clock,
  XCircle,
  ClipboardList,
  PartyPopper,
  Search,
} from "lucide-react-native";
import AnimatedSearch from "../../../components/AnimatedSearch";

export default function StudentMyInternshipsScreen({ student }) {
  const { goBack, navigate } = useContext(NavigationContext);
  const { accessToken } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMyInternships();
  }, []);

  const fetchMyInternships = async () => {
    try {
      const response = await fetch(api.studentMyInternshipsAPI, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setInternships(data.data?.internships || []);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch internships");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusInfo = (item) => {
    if (item.isCompleted) {
      return {
        label: "Completed",
        color: "#8b5cf6",
        bg: "#8b5cf620",
        Icon: CheckCircle,
      };
    }
    switch (item.applicationStatus) {
      case "accepted":
        return { label: "Active", color: "#10b981", bg: "#10b98120", Icon: CheckCircle };
      case "rejected":
        return { label: "Not Selected", color: "#ef4444", bg: "#ef444420", Icon: XCircle };
      default:
        return { label: "Pending Review", color: "#f59e0b", bg: "#f59e0b20", Icon: Clock };
    }
  };

  const filteredInternships = internships.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.domain?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q)
    );
  });

  return (
    <View
      className="flex-1 px-5 pt-8"
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) || "#eef2ff",
      }}
    >
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-4" style={{ zIndex: 10 }}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={goBack}
            className="p-2 rounded-full mr-3 border"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold" style={{ color: colors.header }}>
              My Internships
            </Text>
            <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
              {internships.length} applications
            </Text>
          </View>
        </View>

        <AnimatedSearch
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          colors={colors}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>


      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredInternships.length === 0 ? (
        <View className="flex-1 justify-center items-center opacity-60">
          <ClipboardList size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text className="text-base font-semibold" style={{ color: colors.textSecondary }}>
            {searchQuery ? "No matching applications" : "No applications yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInternships}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchMyInternships(); }}
            />
          }
          renderItem={({ item }) => {
            const statusInfo = getStatusInfo(item);
            const StatusIcon = statusInfo.Icon;

            return (
              <View
                className="p-4 rounded-2xl mb-4 border"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: item.isCompleted ? "#8b5cf6" : colors.border,
                  elevation: 2,
                  borderWidth: item.isCompleted ? 2 : 1,
                }}
              >
                {/* Status badge */}
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    className="flex-row items-center px-3 py-1 rounded-full"
                    style={{ backgroundColor: statusInfo.bg }}
                  >
                    <StatusIcon size={12} color={statusInfo.color} style={{ marginRight: 4 }} />
                    <Text
                      className="text-xs font-bold"
                      style={{ color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </Text>
                  </View>
                  <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                    Applied: {new Date(item.appliedAt).toLocaleDateString()}
                  </Text>
                </View>

                {/* Title + NGO */}
                <Text
                  className="text-base font-bold mb-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  {item.title}
                </Text>
                {item.createdBy && (
                  <Text
                    className="text-[11px] font-semibold mb-2"
                    style={{ color: colors.accent }}
                  >
                    by {item.createdBy.name}
                  </Text>
                )}

                {/* Info pills */}
                <View className="flex-row flex-wrap gap-2 mb-2">
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colors.accent}20` }}>
                    <Text className="text-[11px] font-semibold" style={{ color: colors.accent }}>
                      🎯 {item.domain}
                    </Text>
                  </View>
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.iconBg }}>
                    <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                      📍 {item.location}
                    </Text>
                  </View>
                  {item.stipend && (
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "#10b98115" }}>
                      <Text className="text-[11px] font-semibold" style={{ color: "#10b981" }}>
                        💰 {item.stipend}
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                  📅 {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                </Text>

                {/* ✅ COMPLETED INTERNSHIP BANNER */}
                {item.isCompleted && (
                  <View
                    className="rounded-xl px-4 py-3 mb-3 items-center"
                    style={{
                      backgroundColor: "#8b5cf615",
                      borderWidth: 1,
                      borderColor: "#8b5cf650",
                    }}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 4 }}>🎉</Text>
                    <Text
                      className="text-base font-black text-center"
                      style={{ color: "#8b5cf6" }}
                    >
                      Completed Internship!
                    </Text>
                    <Text
                      className="text-xs text-center mt-1"
                      style={{ color: colors.textSecondary }}
                    >
                      Congratulations on completing this program!
                    </Text>
                  </View>
                )}
                {/* Unified logs button for ACTIVE internship */}
                {item.applicationStatus === "accepted" && !item.isCompleted && (
                  <View className="flex-row justify-end">
                    <TouchableOpacity
                      className="flex-row items-center px-4 py-2 rounded-xl"
                      style={{ backgroundColor: colors.iconBg }}
                      onPress={() =>
                        navigate("StudentWorkLogs", {
                          internshipId: item._id,
                          studentName: "My Work Logs",
                          startDate: item.startDate,
                          endDate: item.endDate,
                        })
                      }
                    >
                      <ClipboardList size={16} color={colors.accent} style={{ marginRight: 6 }} />
                      <Text className="text-sm font-extrabold" style={{ color: colors.accent }}>
                        {item.workLogsCount} Daily logs
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Rejected message */}
                {item.applicationStatus === "rejected" && (
                  <View
                    className="px-3 py-2 rounded-xl"
                    style={{
                      backgroundColor: "#ef444415",
                      borderLeftWidth: 3,
                      borderLeftColor: "#ef4444",
                    }}
                  >
                    <Text className="text-xs" style={{ color: "#ef4444" }}>
                      Unfortunately, your application was not selected for this program.
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
