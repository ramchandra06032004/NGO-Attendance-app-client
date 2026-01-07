import { useState, useContext } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
const api = require("../../../apis/api");

export default function StudentLoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { navigate, goBack } = useContext(NavigationContext);
    const { loginUser, switchUserType } = useContext(AuthContext);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { darkMode, lightTheme, darkTheme } = useTheme();
    const colors = darkMode ? darkTheme : lightTheme;

    async function onLogin() {
        if (!email || !password) {
            alert("Please enter both email and password");
            return;
        }

        setIsLoggingIn(true);
        const reqBody = { email: email, password: password, userType: "student" };
        console.log(reqBody);

        try {
            // Switch user type (logs out if different user was logged in)
            await switchUserType("student");

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
            console.log("Login response:", data);

            const responseData = data.data || data;
            console.log(responseData.user);
            
            const accessToken = responseData.accessToken || responseData.token;
            const refreshToken = responseData.refreshToken;
            const userData = responseData.user;

            // Store in AuthContext
            await loginUser(userData, accessToken, refreshToken, "student");

            alert("Login successful");
            navigate("ScanQRCCode", {
                studentId: userData._id || userData.id,
                college: userData.collegeId,
            });
        } catch (err) {
            console.log("Error in sending login API", err);
            alert("Login failed: " + err.message);
        } finally {
            setIsLoggingIn(false);
        }
    }

    return (
        <View
            className="flex-1 items-center justify-center p-5"
            style={{
                backgroundColor:
                    (colors.backgroundColors && colors.backgroundColors[0]) || "#fff7ed",
            }}
        >
            <View
                className="w-full max-w-[480px] rounded-[20px] p-[22px] shadow-sm shadow-black elevation-4"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
                <Text
                    className="text-[22px] font-extrabold mb-1 text-center"
                    style={{ color: colors.header }}
                >
                    Student Login
                </Text>

                <Text
                    className="mb-5 text-center font-medium text-[15px]"
                    style={{ color: colors.textPrimary }}
                >
                    Sign in to your account
                </Text>

                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    className="p-3 rounded-[10px] mt-[10px] border border-[#fef3c7]"
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
                    className="p-3 rounded-[10px] mt-[10px] border border-[#fef3c7]"
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
                    className="p-[14px] rounded-[10px] items-center mt-6 shadow-sm shadow-black elevation-3"
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
                        <Text className="text-white font-bold text-[16px]">Login</Text>
                    )}
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                onPress={goBack}
                className="mt-[14px]"
                disabled={isLoggingIn}
            >
                <Text
                    className="text-[15px] font-medium"
                    style={{ color: colors.textPrimary }}
                >
                    Cancel
                </Text>
            </TouchableOpacity>
        </View>
    );
}
