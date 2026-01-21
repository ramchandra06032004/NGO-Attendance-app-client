import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
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
      console.log("API Response:", data);

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
    console.log(reqBody);

    try {
      // Switch user type (logs out if different user was logged in)
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
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log("Login response:", data);

      // Extract tokens and user data from response
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      const userData = data.user || selectedNgo;

      // Store in AuthContext
      await loginUser(userData, accessToken, refreshToken, "ngo");

      alert("Login successful");
      navigate("NgoEvents", { ngo: selectedNgo });
    } catch (err) {
      console.log("Error in sending login API", err);
      alert("Login failed: " + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <View
      className="flex-1 items-center justify-center px-4 py-8"
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) ||
          "#fff7ed",
      }}
    >
      <View
        className="w-full max-w-md rounded-3xl p-7 shadow-lg"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        }}
      >
        <Text className="text-2xl font-black text-center mb-6" style={{ color: colors.header }}>
          NGO Login
        </Text>

        <Text className="text-center font-semibold text-base mb-3" style={{ color: colors.textPrimary }}>
          Select NGO
        </Text>
        <ScrollView
          className="rounded-xl mb-5 border"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            maxHeight: 200,
          }}
          contentContainerStyle={{ padding: 8 }}
          showsVerticalScrollIndicator={true}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : error ? (
            <Text className="text-center mb-2 italic" style={{ color: "red" }}>{error}</Text>
          ) : ngoList.length === 0 ? (
            <Text className="text-center mb-2 italic" style={{ color: colors.textSecondary }}>
              No NGOs added yet
            </Text>
          ) : (
            ngoList.map((ngo) => (
              <Pressable
                key={ngo._id}
                className="flex-row items-center justify-between py-3.5 px-4 rounded-xl mb-2.5"
                style={({ pressed }) => ({
                  backgroundColor: selectedNgo.name === ngo.name ? "rgba(26, 188, 156, 0.15)" : "transparent",
                  borderWidth: selectedNgo.name === ngo.name ? 1.5 : 0,
                  borderColor: colors.accent,
                  opacity: pressed ? 0.7 : 1,
                })}
                onPress={() => {
                  setSelectedNgo(ngo);
                  setEmail(ngo.email);
                }}
              >
                <Text
                  className="text-base"
                  style={{
                    color: selectedNgo.name === ngo.name ? colors.accent : colors.textPrimary,
                    fontWeight: selectedNgo.name === ngo.name ? "700" : "400",
                  }}
                >
                  {ngo.name}
                </Text>
                {selectedNgo.name === ngo.name && (
                  <Text className="font-bold text-base" style={{ color: colors.accent }}>✓</Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>

        {selectedNgo ? (
          <>
            <Text className="mt-4 mb-4 text-center font-semibold text-sm" style={{ color: colors.textPrimary }}>
              Signing in as: <Text className="font-bold" style={{ color: colors.accent }}>{selectedNgo.name}</Text>
            </Text>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              className="p-3.5 rounded-xl mt-3 border"
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
              className="p-3.5 rounded-xl mt-3 border"
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
              className="p-4 rounded-xl items-center mt-5 shadow-lg active:shadow-xl"
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
                <Text className="text-white font-bold text-base tracking-wide">Login</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <Text className="mt-6 text-center text-sm" style={{ color: colors.textSecondary }}>
            Please select an NGO to proceed
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={goBack} disabled={isLoggingIn}>
        <Text className="text-base font-semibold mt-6 px-4" style={{ color: colors.textPrimary }}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Tailwind CSS classes are used instead of StyleSheet