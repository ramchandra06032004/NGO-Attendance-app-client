import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logoutAPI } from "../../apis/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // "ngo", "college", "admin"
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Validate token on app startup
  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      const savedUserType = await AsyncStorage.getItem("userType");
      const savedAccessToken = await AsyncStorage.getItem("accessToken");
      const savedRefreshToken = await AsyncStorage.getItem("refreshToken");
      const savedUser = await AsyncStorage.getItem("user");

      console.log("[AuthContext] Validating token:", {
        hasAccessToken: !!savedAccessToken,
        hasUser: !!savedUser,
        userType: savedUserType
      });

      if (savedAccessToken && savedUser) {
        setAccessToken(savedAccessToken);
        setRefreshToken(savedRefreshToken);
        setUser(JSON.parse(savedUser));
        setUserType(savedUserType);
        console.log("[AuthContext] Token restored successfully");
      } else {
        console.log("[AuthContext] No valid token found in storage");
      }
    } catch (error) {
      console.error("Error validating token:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(logoutAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error("Error calling logout API:", error);
    } finally {
      // Clear local storage regardless of API response
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userType");
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setUserType(null);
    }
  };

  const loginUser = async (userData, token, refreshTok, type) => {
    console.log("[AuthContext] loginUser called:", {
      hasToken: !!token,
      hasRefreshToken: !!refreshTok,
      userType: type,
      userData: userData?.name || userData?.email
    });

    if (token !== null && token !== undefined) {
      await AsyncStorage.setItem("accessToken", token);
      console.log("[AuthContext] Access token saved to storage");
    }
    if (refreshTok !== null && refreshTok !== undefined) {
      await AsyncStorage.setItem("refreshToken", refreshTok);
    }
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    await AsyncStorage.setItem("userType", type);
    setAccessToken(token);
    setRefreshToken(refreshTok);
    setUser(userData);
    setUserType(type);
    console.log("[AuthContext] Login complete, token set in state");
  };

  const switchUserType = async (newUserType) => {
    if (userType && userType !== newUserType) {
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        loading,
        accessToken,
        refreshToken,
        logout,
        loginUser,
        switchUserType,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
