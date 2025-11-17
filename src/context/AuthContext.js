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

      if (savedAccessToken && savedUser) {
        setAccessToken(savedAccessToken);
        setRefreshToken(savedRefreshToken);
        setUser(JSON.parse(savedUser));
        setUserType(savedUserType);
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
    if (token !== null && token !== undefined) {
      await AsyncStorage.setItem("accessToken", token);
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
