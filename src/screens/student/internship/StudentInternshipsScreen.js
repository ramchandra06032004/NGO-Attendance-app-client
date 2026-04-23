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
import { ChevronLeft, Briefcase, BookOpen, Search } from "lucide-react-native";
import AnimatedSearch from "../../../components/AnimatedSearch";

export default function StudentInternshipsScreen({ student, isTab }) {
  const { goBack, navigate } = useContext(NavigationContext);
  const { accessToken } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      const response = await fetch(api.studentInternshipsAPI, {
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
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApply = async (internship) => {
    setApplyingId(internship._id);
    try {
      const response = await fetch(api.studentApplyInternshipAPI(internship._id), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Applied!", data.message || "Application submitted successfully!");
        fetchInternships(); // refresh badges
      } else {
        Alert.alert("Error", data.message || "Failed to apply");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setApplyingId(null);
    }
  };

  const filteredInternships = internships.filter((item) => {
    if (!searchQuery.trim()) return item.isActive;
    const q = searchQuery.toLowerCase();
    return (
      item.isActive &&
      (item.title?.toLowerCase().includes(q) ||
        item.domain?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.createdBy?.name?.toLowerCase().includes(q))
    );
  });

  const getApplyLabel = (item) => {
    if (!item.hasApplied) return { text: "Apply Now", bg: "#2563eb", disabled: false };
    if (item.applicationStatus === "pending") return { text: "⏳ Pending", bg: "#f59e0b", disabled: true };
    if (item.applicationStatus === "accepted") return { text: "✓ Accepted", bg: "#10b981", disabled: true };
    if (item.applicationStatus === "rejected") return { text: "✕ Sorry, not selected", bg: "#ef4444", disabled: true };
    return { text: "Applied", bg: "#94a3b8", disabled: true };
  };
  return (
    <View
      className={`flex-1 px-5 ${isTab ? "pt-2" : "pt-8"}`}
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) || "#eef2ff",
      }}
    >
      {/* Header */}
      {!isTab && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          {/* Back + Title */}
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
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.header }}>Internship Offers</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Browse & apply</Text>
          </View>

          {/* Search — expands to fixed 200px, won't push My button */}
          <AnimatedSearch
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            colors={colors}
            containerStyle={{ marginBottom: 0, marginRight: 8 }}
          />
        </View>
      )}

      {isTab && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.header, flex: 1 }}>
            Browse Internships
          </Text>
          <AnimatedSearch
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            colors={colors}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      )}

      {/* My Internships */}
      {!isTab && (
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.accent,
            backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
            marginBottom: 16,
            marginTop: 4,
          }}
          onPress={() => navigate("StudentMyInternships", { student })}
        >
          <BookOpen size={16} color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent }}>My Internships</Text>
        </TouchableOpacity>
      )}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredInternships.length === 0 ? (
        <View className="flex-1 justify-center items-center opacity-60">
          <Briefcase size={48} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text className="text-base font-semibold" style={{ color: colors.textSecondary }}>
            {searchQuery ? "No matching internships" : "No internships available"}
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
              onRefresh={() => { setRefreshing(true); fetchInternships(); }}
            />
          }
          renderItem={({ item }) => {
            const applyStyle = getApplyLabel(item);
            const isApplying = applyingId === item._id;

            return (
              <View
                className="p-4 rounded-2xl mb-4 border"
                style={{
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                  elevation: 2,
                }}
              >
                {/* Title + NGO */}
                <Text
                  className="text-base font-bold mb-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  {item.title}
                </Text>
                {item.createdBy && (
                  <Text className="text-[11px] font-semibold mb-2" style={{ color: colors.accent }}>
                    by {item.createdBy.name}
                  </Text>
                )}

                {/* Tags row */}
                <View className="flex-row flex-wrap gap-2 mb-2">
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${colors.accent}20` }}
                  >
                    <Text className="text-[11px] font-semibold" style={{ color: colors.accent }}>
                      🎯 {item.domain}
                    </Text>
                  </View>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: colors.iconBg }}
                  >
                    <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
                      📍 {item.location}
                    </Text>
                  </View>
                  {item.stipend && (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#10b98115" }}
                    >
                      <Text className="text-[11px] font-semibold" style={{ color: "#10b981" }}>
                        💰 {item.stipend}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                <Text
                  className="text-sm leading-5 mb-2"
                  numberOfLines={2}
                  style={{ color: colors.textSecondary }}
                >
                  {item.description}
                </Text>

                {/* Dates + slots */}
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>
                    📅 {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                  </Text>
                  <Text className="text-xs font-semibold" style={{ color: item.slotsLeft > 0 ? "#10b981" : "#ef4444" }}>
                    {item.slotsLeft} slot{item.slotsLeft !== 1 ? "s" : ""} left
                  </Text>
                </View>

                {/* Apply button */}
                <TouchableOpacity
                  className="py-2.5 rounded-xl items-center"
                  style={{
                    backgroundColor: isApplying
                      ? `${applyStyle.bg}80`
                      : applyStyle.bg,
                  }}
                  onPress={() => !applyStyle.disabled && handleApply(item)}
                  disabled={applyStyle.disabled || isApplying}
                  activeOpacity={applyStyle.disabled ? 1 : 0.7}
                >
                  {isApplying ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-sm">
                      {applyStyle.text}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
