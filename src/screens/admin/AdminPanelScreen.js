import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { AttendanceContext } from "../../context/AttendanceContext";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Toast from "react-native-toast-message";
import * as api from "../../../apis/api";

export default function AdminPanelScreen() {
  const { addCollege, addNgo } = useContext(AttendanceContext);
  const { navigate } = useContext(NavigationContext);
  const { logout } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [collegesList, setCollegesList] = useState([]);
  const [ngosList, setNgosList] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingNgos, setLoadingNgos] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [ngoSearch, setNgoSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityType, setEntityType] = useState(null);

  useEffect(() => {
    fetchNgos();
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch(api.getAllCollegeAPI, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("API Response:", data);
      const collegesArray = data?.data?.colleges || [];
      setCollegesList(Array.isArray(collegesArray) ? collegesArray : []);
      setLoadingColleges(false);
    } catch (err) {
      console.error("Error fetching Colleges: ", err);
      setLoadingColleges(false);
    }
  };

  const fetchNgos = async () => {
    try {
      const response = await fetch(api.getAllNgoAPI, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      const ngosArray = data.statusCode || data.ngos || data.data || [];
      setNgosList(Array.isArray(ngosArray) ? ngosArray : []);
      setLoadingNgos(false);
    } catch (err) {
      console.error("Error fetching NGOs:", err);
      setLoadingNgos(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("Home");
  };

  const renderItemName = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;
    if (item.name) return item.name;
    if (item.title) return item.title;
    if (item.email) return item.email;
    return JSON.stringify(item);
  };

  // Filter colleges based on search
  const filteredColleges = collegesList.filter((college) => {
    if (!collegeSearch.trim()) return true;
    const name = renderItemName(college)?.toLowerCase() || "";
    return name.includes(collegeSearch.toLowerCase());
  });

  // Filter NGOs based on search
  const filteredNgos = ngosList.filter((ngo) => {
    if (!ngoSearch.trim()) return true;
    const name = renderItemName(ngo)?.toLowerCase() || "";
    return name.includes(ngoSearch.toLowerCase());
  });

  // Get initials from name (first 2 letters)
  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle entity click
  const handleEntityClick = (entity, type) => {
    setSelectedEntity(entity);
    setEntityType(type);
    navigate("EntityDetail", { entity, entityType: type });
  };

  // Show detail view if entity is selected
  if (selectedEntity && entityType) {
    const EntityDetailScreen = require("./EntityDetailScreen").default;
    return <EntityDetailScreen entity={selectedEntity} entityType={entityType} />;
  }

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) || "#f0fdf4",
      }}
    >
      {/* Header */}
      <View className="px-5 pt-8 pb-4" style={{ backgroundColor: colors.cardBg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-extrabold mb-1" style={{ color: colors.header }}>
              Admin Panel
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Manage Colleges and NGOs
            </Text>
          </View>
          <TouchableOpacity
            className="px-4 py-2 rounded-xl border"
            style={{ borderColor: colors.border, backgroundColor: colors.error || '#ef4444' }}
            onPress={handleLogout}
          >
            <Text className="text-white font-bold text-sm">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Badges */}
        <View className="flex-row gap-3">
          <View className="flex-1 px-3 py-2 rounded-xl" style={{ backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '30' }}>
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>COLLEGES</Text>
            <Text className="text-xl font-bold" style={{ color: colors.accent }}>{collegesList.length}</Text>
          </View>
          <View className="flex-1 px-3 py-2 rounded-xl" style={{ backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '30' }}>
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>NGOs</Text>
            <Text className="text-xl font-bold" style={{ color: colors.accent }}>{ngosList.length}</Text>
          </View>
        </View>
      </View>

      {/* Main Content - Scrollable */}
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={true}>
        {/* Colleges Section */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold" style={{ color: colors.header }}>
              Colleges ({filteredColleges.length})
            </Text>
            <TouchableOpacity
              className="px-4 py-2 rounded-xl"
              style={{ backgroundColor: colors.accent }}
              onPress={() => navigate("AddCollege")}
            >
              <Text className="text-white font-bold text-sm">+ Add College</Text>
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
              placeholder="Search colleges..."
              placeholderTextColor={colors.textSecondary}
              value={collegeSearch}
              onChangeText={setCollegeSearch}
            />
          </View>

          {/* Colleges List */}
          <View
            className="rounded-xl border"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              maxHeight: 300,
            }}
          >
            {loadingColleges ? (
              <View className="p-8 items-center">
                <ActivityIndicator size="large" color={colors.accent} />
                <Text className="mt-2" style={{ color: colors.textSecondary }}>Loading colleges...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredColleges}
                keyExtractor={(item, idx) =>
                  item && (item._id || item.id) ? item._id || item.id : String(idx)
                }
                renderItem={({ item, index }) => {
                  const itemName = renderItemName(item);
                  const logoUrl = item?.logo || item?.logoUrl;

                  return (
                    <TouchableOpacity
                      onPress={() => handleEntityClick(item, 'college')}
                      className="px-4 py-3 border-b flex-row items-center"
                      style={{
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3 overflow-hidden"
                        style={{ backgroundColor: colors.accent + '20', borderWidth: 1, borderColor: colors.accent + '30' }}
                      >
                        {logoUrl ? (
                          <Image
                            source={{ uri: logoUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="font-bold text-sm" style={{ color: colors.accent }}>
                            {getInitials(itemName)}
                          </Text>
                        )}
                      </View>
                      <Text className="flex-1 font-semibold" style={{ color: colors.textPrimary }}>
                        {itemName}
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>›</Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View className="p-8 items-center">
                    <Text className="text-lg font-semibold mb-1" style={{ color: colors.textSecondary }}>
                      No Colleges Found
                    </Text>
                    <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                      {collegeSearch ? "Try a different search term" : "Add your first college to get started"}
                    </Text>
                  </View>
                }
                nestedScrollEnabled
              />
            )}
          </View>
        </View>

        {/* NGOs Section */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold" style={{ color: colors.header }}>
              NGOs ({filteredNgos.length})
            </Text>
            <TouchableOpacity
              className="px-4 py-2 rounded-xl"
              style={{ backgroundColor: colors.accent }}
              onPress={() => navigate("AddNgo")}
            >
              <Text className="text-white font-bold text-sm">+ Add NGO</Text>
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
              placeholder="Search NGOs..."
              placeholderTextColor={colors.textSecondary}
              value={ngoSearch}
              onChangeText={setNgoSearch}
            />
          </View>

          {/* NGOs List */}
          <View
            className="rounded-xl border"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              maxHeight: 300,
            }}
          >
            {loadingNgos ? (
              <View className="p-8 items-center">
                <ActivityIndicator size="large" color={colors.accent} />
                <Text className="mt-2" style={{ color: colors.textSecondary }}>Loading NGOs...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredNgos}
                keyExtractor={(item, idx) =>
                  item && (item._id || item.id) ? item._id || item.id : String(idx)
                }
                renderItem={({ item, index }) => {
                  const itemName = renderItemName(item);
                  const logoUrl = item?.logo || item?.logoUrl || item?.profileImage;

                  return (
                    <TouchableOpacity
                      onPress={() => handleEntityClick(item, 'ngo')}
                      className="px-4 py-3 border-b flex-row items-center"
                      style={{
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3 overflow-hidden"
                        style={{ backgroundColor: colors.accent + '20', borderWidth: 1, borderColor: colors.accent + '30' }}
                      >
                        {logoUrl ? (
                          <Image
                            source={{ uri: logoUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Text className="font-bold text-sm" style={{ color: colors.accent }}>
                            {getInitials(itemName)}
                          </Text>
                        )}
                      </View>
                      <Text className="flex-1 font-semibold" style={{ color: colors.textPrimary }}>
                        {itemName}
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>›</Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View className="p-8 items-center">
                    <Text className="text-lg font-semibold mb-1" style={{ color: colors.textSecondary }}>
                      No NGOs Found
                    </Text>
                    <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                      {ngoSearch ? "Try a different search term" : "Add your first NGO to get started"}
                    </Text>
                  </View>
                }
                nestedScrollEnabled
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}