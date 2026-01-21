import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";

export default function CollegeLoginScreen() {
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { navigate, goBack } = useContext(NavigationContext);
  const { loginUser, switchUserType } = useContext(AuthContext);
  const [collegesList, setCollegesList] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
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

      if (!Array.isArray(collegesArray)) {
        console.error("Invalid colleges data:", collegesArray);
        throw new Error("Invalid response format");
      }

      setCollegesList(Array.isArray(collegesArray) ? collegesArray : []);
      setLoadingColleges(false);
    } catch (err) {
      console.error("Error fetching Colleges: ", err);
      setLoadingColleges(false);
    }
  };

  async function onLogin() {
    if (!selectedCollege) return;

    setIsLoggingIn(true);
    const reqBody = { email: email, password: password, userType: "college" };
    console.log(reqBody);

    try {
      // Switch user type (logs out if different user was logged in)
      await switchUserType("college");

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
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log("Login response:", data);

      // Extract tokens and user data from response
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      const userData = data.user || selectedCollege;

      // Store in AuthContext
      await loginUser(userData, accessToken, refreshToken, "college");

      alert("Login successful");
      navigate("CollegeClasses", { college: selectedCollege });
    } catch (err) {
      console.log("Error in sending login API", err);
      alert("Login failed: " + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <View
      className="flex-1 px-5 py-8"
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) || "#ecfeff",
      }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg border"
          style={{ borderColor: colors.border }}
        >
        <Text className="text-2xl font-black text-center mb-4" style={{ color: colors.header }}>
          College Login
        </Text>

        <Text className="text-sm mb-4" style={{ color: colors.textPrimary }}>
          Select college
        </Text>

        <View
          className="rounded-2xl mb-4 border overflow-hidden"
          style={{ backgroundColor: colors.iconBg, borderColor: colors.border }}
        >
          {loadingColleges ? (
            <ActivityIndicator size="small" color={colors.textPrimary} style={{ padding: 20 }} />
          ) : (
            <FlatList
              data={collegesList}
              keyExtractor={(item, index) =>
                String(item?.id ?? item?._id ?? item?.code ?? index)
              }
              renderItem={({ item, index }) => {
                const id = String(item?.id ?? item?._id ?? item?.code ?? index);
                const selectedId = String(
                  selectedCollege?.id ??
                    selectedCollege?._id ??
                    selectedCollege?.code ??
                    ""
                );
                const active = selectedId === id;
                const label =
                  item?.name ??
                  item?.collegeName ??
                  item?.title ??
                  item?.label ??
                  item?.instituteName ??
                  `College ${index + 1}`;

                return (
                  <Pressable
                    onPress={() => {
                      setSelectedCollege(item);
                      setEmail(item.email || "");
                    }}
                    className="flex-row items-center justify-between py-3 px-4 rounded-lg"
                    style={{
                      backgroundColor: active ? (darkMode ? "#ffffff12" : "#fcfbf7ff") : "transparent",
                      borderWidth: active ? 1 : 0,
                      borderColor: active ? colors.accent : "transparent",
                    }}
                  >
                    <Text
                      className={`text-sm ${active ? "font-bold" : "font-normal"}`}
                      style={[{ color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                    {active ? (
                      <Text className="font-bold text-base" style={{ color: colors.accent }}>
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
              contentContainerStyle={{ padding: 6 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text className="text-center mt-2" style={{ color: colors.textSecondary }}>
                  No colleges found
                </Text>
              }
              style={{ maxHeight: 240 }}
            />
          )}
        </View>

        {selectedCollege ? (
          <View className="mt-4">
            <Text className="text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
              Logging in as{" "}
              <Text className="font-bold" style={{ color: colors.header }}>
                {selectedCollege.name}
              </Text>
            </Text>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              className="p-4 rounded-lg mb-4 border text-base"
              style={{
                backgroundColor: colors.iconBg,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.textSecondary}
              editable={!isLoggingIn}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              className="p-4 rounded-lg mb-4 border text-base"
              style={{
                backgroundColor: colors.iconBg,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
              secureTextEntry
              placeholderTextColor={colors.textSecondary}
              editable={!isLoggingIn}
            />

            <TouchableOpacity
              className="p-4 rounded-lg items-center"
              style={{
                backgroundColor: colors.accent,
                opacity: isLoggingIn ? 0.6 : 1,
              }}
              onPress={onLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Login</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <Text className="text-center text-sm mt-3" style={{ color: colors.textSecondary }}>
            Please select a college to continue
          </Text>
        )}
      </View>
      </ScrollView>

      <TouchableOpacity
        onPress={goBack}
        className="mt-4 pb-2"
        disabled={isLoggingIn}
      >
        <Text className="text-base" style={{ color: colors.textPrimary }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}