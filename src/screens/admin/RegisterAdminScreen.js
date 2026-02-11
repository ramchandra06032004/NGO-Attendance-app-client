import React, { useState, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import Toast from "react-native-toast-message";

const api = require("../../../apis/api");

export default function RegisterAdminScreen() {
    const { goBack } = useContext(NavigationContext);
    const { darkMode, lightTheme, darkTheme } = useTheme();
    const colors = darkMode ? darkTheme : lightTheme;

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit() {
        // Validation
        if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            const message = "All fields are required";
            if (Platform.OS === "web") {
                window.alert(message);
            } else {
                Alert.alert("Validation Error", message);
            }
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const message = "Please enter a valid email address";
            if (Platform.OS === "web") {
                window.alert(message);
            } else {
                Alert.alert("Validation Error", message);
            }
            return;
        }

        // Password match validation
        if (password !== confirmPassword) {
            const message = "Passwords do not match";
            if (Platform.OS === "web") {
                window.alert(message);
            } else {
                Alert.alert("Validation Error", message);
            }
            return;
        }

        // Password strength validation
        if (password.length < 6) {
            const message = "Password must be at least 6 characters long";
            if (Platform.OS === "web") {
                window.alert(message);
            } else {
                Alert.alert("Validation Error", message);
            }
            return;
        }

        setLoading(true);

        try {
            console.log("Submitting to:", api.registerAdmin);

            const response = await fetch(api.registerAdmin, {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username.trim(),
                    email: email.trim(),
                    password: password,
                }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(
                    responseData.message || `HTTP Status: ${response.status}`
                );
            }

            // Success Handling
            setLoading(false);

            Toast.show({
                type: "success",
                text1: "Success",
                text2: "Admin registered successfully",
                position: "top",
            });

            if (Platform.OS === "web") {
                window.alert("Admin Registered Successfully");
                goBack();
            } else {
                Alert.alert("Success", "Admin Registered Successfully", [
                    { text: "OK", onPress: () => goBack() },
                ]);
            }
        } catch (err) {
            setLoading(false);
            console.error("Error registering admin:", err.message);

            Toast.show({
                type: "error",
                text1: "Error",
                text2: err.message || "Failed to register admin",
                position: "top",
            });

            if (Platform.OS === "web") {
                window.alert("Failed: " + err.message);
            } else {
                Alert.alert("Error", err.message);
            }
        }
    }

    return (
        <View
            className="flex-1"
            style={{
                backgroundColor: colors.backgroundColors
                    ? colors.backgroundColors[0]
                    : "#fff",
            }}
        >
            {/* Header */}
            <View
                className="px-5 pt-8 pb-4"
                style={{
                    backgroundColor: colors.cardBg,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }}
            >
                <View className="flex-row items-center justify-between mb-2">
                    <View>
                        <Text
                            className="text-2xl font-extrabold mb-1"
                            style={{ color: colors.header }}
                        >
                            Register Admin
                        </Text>
                        <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            Create a new admin account
                        </Text>
                    </View>
                    <TouchableOpacity
                        className="px-4 py-2 rounded-xl border"
                        style={{
                            borderColor: colors.border,
                            backgroundColor: colors.iconBg,
                        }}
                        onPress={() => goBack()}
                    >
                        <Text
                            className="font-bold text-sm"
                            style={{ color: colors.textPrimary }}
                        >
                            ← Back
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-5 pt-6"
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View
                    className="p-4 rounded-xl mb-6 border"
                    style={{
                        backgroundColor: colors.accent + "15",
                        borderColor: colors.accent + "30",
                    }}
                >
                    <Text
                        className="text-sm font-semibold mb-1"
                        style={{ color: colors.accent }}
                    >
                        ℹ️ Admin Registration
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        {Platform.OS === "web"
                            ? "Only existing admins can register new admins. If this is the first admin, registration is open."
                            : "Only existing admins can register new admins.\nIf this is the first admin, registration is open."}
                    </Text>
                </View>

                {/* Form Card */}
                <View
                    className="rounded-xl border p-5 mb-6"
                    style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                    }}
                >
                    {/* Username Input */}
                    <View className="mb-4">
                        <Text
                            className="text-sm font-semibold mb-2"
                            style={{ color: colors.textSecondary }}
                        >
                            Username
                        </Text>
                        <TextInput
                            placeholder="Enter username"
                            placeholderTextColor={colors.textSecondary}
                            value={username}
                            onChangeText={setUsername}
                            className="p-3 rounded-xl border"
                            style={{
                                backgroundColor: colors.iconBg,
                                borderColor: colors.border,
                                color: colors.textPrimary,
                            }}
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </View>

                    {/* Email Input */}
                    <View className="mb-4">
                        <Text
                            className="text-sm font-semibold mb-2"
                            style={{ color: colors.textSecondary }}
                        >
                            Email Address
                        </Text>
                        <TextInput
                            placeholder="Enter email address"
                            placeholderTextColor={colors.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            className="p-3 rounded-xl border"
                            style={{
                                backgroundColor: colors.iconBg,
                                borderColor: colors.border,
                                color: colors.textPrimary,
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                    </View>

                    {/* Password Input */}
                    <View className="mb-4">
                        <Text
                            className="text-sm font-semibold mb-2"
                            style={{ color: colors.textSecondary }}
                        >
                            Password
                        </Text>
                        <TextInput
                            placeholder="Create password (min 6 characters)"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            className="p-3 rounded-xl border"
                            style={{
                                backgroundColor: colors.iconBg,
                                borderColor: colors.border,
                                color: colors.textPrimary,
                            }}
                            editable={!loading}
                        />
                    </View>

                    {/* Confirm Password Input */}
                    <View className="mb-4">
                        <Text
                            className="text-sm font-semibold mb-2"
                            style={{ color: colors.textSecondary }}
                        >
                            Confirm Password
                        </Text>
                        <TextInput
                            placeholder="Re-enter password"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            className="p-3 rounded-xl border"
                            style={{
                                backgroundColor: colors.iconBg,
                                borderColor: colors.border,
                                color: colors.textPrimary,
                            }}
                            editable={!loading}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className="p-4 rounded-xl items-center mt-2"
                        style={{
                            backgroundColor: loading ? colors.border : colors.accent,
                            opacity: loading ? 0.6 : 1,
                        }}
                        onPress={onSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <View className="flex-row items-center">
                                <ActivityIndicator size="small" color="#fff" />
                                <Text className="text-white font-bold text-base ml-2">
                                    Registering...
                                </Text>
                            </View>
                        ) : (
                            <Text className="text-white font-bold text-base">
                                Register Admin
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Security Notice */}
                <View
                    className="p-4 rounded-xl mb-6 border"
                    style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                    }}
                >
                    <Text
                        className="text-xs font-semibold mb-2"
                        style={{ color: colors.textSecondary }}
                    >
                        🔒 Security Notice
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        • Use a strong, unique password{"\n"}
                        • Keep your credentials secure{"\n"}
                        • Admin accounts have full system access
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
