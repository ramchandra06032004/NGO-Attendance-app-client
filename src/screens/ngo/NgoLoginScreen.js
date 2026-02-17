import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Search, Mail, Lock, HeartHandshake, Check, ChevronLeft } from "lucide-react-native";
const api = require("../../../apis/api");

export default function NgoLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { navigate, goBack } = useContext(NavigationContext);
  const { loginUser, switchUserType } = useContext(AuthContext);
  const [ngoList, setNgoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNgo, setSelectedNgo] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchNgos();
  }, []);

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
      const ngosArray = data.statusCode || data.ngos || data.data || (Array.isArray(data) ? data : []);
      setNgoList(Array.isArray(ngosArray) ? ngosArray : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching NGOs:", err);
      setError("Failed to fetch NGOs");
      setLoading(false);
    }
  };

  async function onLogin() {
    if (!selectedNgo) return;

    setIsLoggingIn(true);
    const reqBody = { email: email, password: password, userType: "ngo" };

    try {
      await switchUserType("ngo");

      const response = await fetch(api.loginAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.message) errMsg = errData.message;
        } catch { }
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log("[NgoLogin] Backend response:", {
        hasAccessToken: !!(data.data?.accessToken || data.data?.token || data.accessToken || data.token),
        hasRefreshToken: !!(data.data?.refreshToken || data.refreshToken),
        hasUser: !!(data.data?.user || data.user),
        dataKeys: Object.keys(data),
        nestedDataKeys: data.data ? Object.keys(data.data) : []
      });

      // Backend wraps response in ApiResponse class, so token is in data.data
      const responseData = data.data || data;
      const accessToken = responseData.accessToken || responseData.token;
      const refreshToken = responseData.refreshToken;
      const userData = responseData.user || selectedNgo;

      console.log("[NgoLogin] Calling loginUser with token:", !!accessToken);
      await loginUser(userData, accessToken, refreshToken, "ngo");

      alert("Login successful");
      navigate("NgoEvents", { ngo: selectedNgo });
    } catch (err) {
      alert("Login failed: " + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  }

  const filteredNgos = ngoList.filter((ngo) => {
    const name = ngo.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View className="flex-1" style={{ backgroundColor: colors.backgroundColors[0] }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View className="flex-row items-center mb-6 mt-4">
            <TouchableOpacity
              onPress={goBack}
              className="p-2 rounded-full mr-4 border"
              style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
              <ChevronLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text className="text-2xl font-black" style={{ color: colors.header }}>
              NGO Portal
            </Text>
          </View>

          {/* Main Card */}
          <View
            className="w-full rounded-3xl p-6 shadow-sm border"
            style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
          >
            {/* NGO Selection Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <HeartHandshake size={20} color={colors.accent} style={{ marginRight: 8 }} />
                <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
                  Select Your NGO
                </Text>
              </View>

              {/* Search Bar */}
              <View
                className="flex-row items-center p-3 rounded-xl mb-4 border"
                style={{ backgroundColor: colors.iconBg, borderColor: colors.border }}
              >
                <Search size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Search NGO..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 text-base"
                  style={{ color: colors.textPrimary, outlineStyle: "none" }}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* NGO List */}
              <View
                className="rounded-xl border overflow-hidden"
                style={{ height: 200, borderColor: colors.border }}
              >
                {loading ? (
                  <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="small" color={colors.accent} />
                  </View>
                ) : error ? (
                  <View className="p-4 items-center">
                    <Text style={{ color: "red" }}>{error}</Text>
                  </View>
                ) : (
                  <ScrollView nestedScrollEnabled={true}>
                    {filteredNgos.length === 0 ? (
                      <View className="p-4 items-center">
                        <Text style={{ color: colors.textSecondary }}>No NGOs found</Text>
                      </View>
                    ) : (
                      filteredNgos.map((ngo, index) => {
                        const isSelected = selectedNgo._id === ngo._id;
                        return (
                          <Pressable
                            key={ngo._id || index}
                            onPress={() => {
                              setSelectedNgo(ngo);
                              setEmail(ngo.email);
                            }}
                            className={`flex-row items-center justify-between p-3 border-b`}
                            style={{
                              backgroundColor: isSelected ? (darkMode ? "rgba(45, 212, 191, 0.15)" : "#f0fdfa") : "transparent",
                              borderBottomColor: colors.border,
                              borderBottomWidth: index === filteredNgos.length - 1 ? 0 : 1
                            }}
                          >
                            <Text
                              className={`flex-1 text-sm ${isSelected ? "font-bold" : "font-medium"}`}
                              style={{ color: isSelected ? colors.accent : colors.textPrimary }}
                            >
                              {ngo.name}
                            </Text>
                            {isSelected && <Check size={16} color={colors.accent} />}
                          </Pressable>
                        );
                      })
                    )}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Login Form Section */}
            {selectedNgo && (
              <View className="pt-4 border-t" style={{ borderColor: colors.border }}>
                <Text className="text-sm font-medium mb-4 text-center" style={{ color: colors.textSecondary }}>
                  Logging in as <Text style={{ color: colors.header, fontWeight: 'bold' }}>{selectedNgo.name}</Text>
                </Text>

                <View className="gap-4">
                  <View
                    className="flex-row items-center p-3.5 rounded-xl border"
                    style={{ backgroundColor: colors.iconBg, borderColor: colors.border }}
                  >
                    <Mail size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput
                      placeholder="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      className="flex-1 text-base"
                      style={{ color: colors.textPrimary, outlineStyle: "none" }}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoggingIn}
                    />
                  </View>

                  <View
                    className="flex-row items-center p-3.5 rounded-xl border"
                    style={{ backgroundColor: colors.iconBg, borderColor: colors.border }}
                  >
                    <Lock size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      className="flex-1 text-base"
                      style={{ color: colors.textPrimary, outlineStyle: "none" }}
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      editable={!isLoggingIn}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={onLogin}
                    disabled={isLoggingIn}
                    className="py-4 rounded-xl items-center mt-2 shadow-sm"
                    style={{
                      backgroundColor: colors.accent,
                      opacity: isLoggingIn ? 0.7 : 1
                    }}
                  >
                    {isLoggingIn ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-white font-bold text-base tracking-wide">
                        Secure Login
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!selectedNgo && (
              <View className="items-center py-4 opacity-50">
                <Text style={{ color: colors.textSecondary }}>Select an NGO to continue</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}