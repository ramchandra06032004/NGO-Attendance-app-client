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
import { ChevronLeft, Briefcase, Users, Plus, Search } from "lucide-react-native";
import AnimatedSearch from "../../../components/AnimatedSearch";

export default function NgoInternshipsScreen({ ngo }) {
  const { navigate, goBack } = useContext(NavigationContext);
  const { accessToken } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      const response = await fetch(api.ngoInternshipsAPI, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setInternships(data.data || []);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch internships");
      }
    } catch (err) {
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInternships();
  };

  const getStatusColor = (internship) => {
    const now = new Date();
    if (new Date(internship.endDate) < now) return "#94a3b8";
    return colors.accent;
  };

  const getStatusLabel = (internship) => {
    const now = new Date();
    if (new Date(internship.endDate) < now) return "Ended";
    if (new Date(internship.startDate) > now) return "Upcoming";
    return "Active";
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
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity
          onPress={goBack}
          style={{
            padding: 8,
            borderRadius: 20,
            marginRight: 10,
            borderWidth: 1,
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          }}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.header }}>Internships</Text>
          <Text style={{ fontSize: 10, color: colors.textSecondary }}>{internships.length} programs</Text>
        </View>

        <AnimatedSearch
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          colors={colors}
          containerStyle={{ marginBottom: 0, marginRight: 8 }}
        />

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: colors.accent,
            height: 40,
          }}
          onPress={() => navigate("CreateInternship")}
        >
          <Plus size={14} color="white" style={{ marginRight: 4 }} />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredInternships.length === 0 ? (
        <View className="flex-1 justify-center items-center opacity-60">
          <Briefcase size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text className="text-base font-semibold" style={{ color: colors.textSecondary }}>
            {searchQuery ? "No matching programs" : "No internships yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInternships}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item);
            const statusLabel = getStatusLabel(item);
            return (
              <TouchableOpacity
                className="p-4 rounded-2xl mb-4 border"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                  elevation: 2,
                }}
                onPress={() =>
                  navigate("InternshipApplicants", { internship: item })
                }
                activeOpacity={0.8}
              >
                {/* Title + Status */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-3">
                    <Text
                      className="text-base font-bold mb-0.5"
                      style={{ color: colors.textPrimary }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <View
                      className="flex-row items-center px-2 py-0.5 rounded-full self-start"
                      style={{ backgroundColor: `${statusColor}20` }}
                    >
                      <Text
                        className="text-[11px] font-bold"
                        style={{ color: statusColor }}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                  {/* Slots badge */}
                  <View
                    className="px-2.5 py-1.5 rounded-xl items-center"
                    style={{ backgroundColor: colors.iconBg }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: colors.accent }}
                    >
                      {item.acceptedCount}/{item.totalSlots}
                    </Text>
                    <Text
                      className="text-[9px]"
                      style={{ color: colors.textSecondary }}
                    >
                      slots
                    </Text>
                  </View>
                </View>

                {/* Domain + Location */}
                <Text
                  className="text-xs font-semibold mb-1"
                  style={{ color: colors.accent }}
                >
                  🎯 {item.domain}
                </Text>
                <Text
                  className="text-xs mb-2"
                  style={{ color: colors.textSecondary }}
                >
                  📍 {item.location}
                </Text>

                {/* Dates */}
                <Text
                  className="text-xs mb-3"
                  style={{ color: colors.textSecondary }}
                >
                  📅 {new Date(item.startDate).toLocaleDateString()} →{" "}
                  {new Date(item.endDate).toLocaleDateString()}
                </Text>

                {/* Applicant count pills */}
                <View className="flex-row gap-2">
                  <View
                    className="px-3 py-1 rounded-full flex-row items-center"
                    style={{ backgroundColor: "#f59e0b20" }}
                  >
                    <Users size={11} color="#f59e0b" style={{ marginRight: 4 }} />
                    <Text className="text-[11px] font-bold" style={{ color: "#f59e0b" }}>
                      {item.pendingCount} pending
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full flex-row items-center"
                    style={{ backgroundColor: "#10b98120" }}
                  >
                    <Text className="text-[11px] font-bold" style={{ color: "#10b981" }}>
                      ✓ {item.acceptedCount} accepted
                    </Text>
                  </View>
                  {item.rejectedCount > 0 && (
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: "#ef444420" }}
                    >
                      <Text className="text-[11px] font-bold" style={{ color: "#ef4444" }}>
                        ✕ {item.rejectedCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
