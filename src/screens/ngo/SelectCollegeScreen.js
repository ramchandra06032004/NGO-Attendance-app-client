import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from "react-native";
import QRCode from 'react-native-qrcode-svg';
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import * as api from "../../../apis/api";

const { width } = Dimensions.get('window');

export default function SelectCollegeScreen({ eventId }) {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const { accessToken } = useContext(AuthContext);

  const [qrToken, setQrToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  
  // To clear interval on unmount
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    fetchQrCode();

    // Set up 1-second interval for countdown
    intervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          fetchQrCode(); // Trigger fetch
          return 10;     // Reset timer
        }
        return prevTime - 1; // Decrement
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [eventId]);

  const fetchQrCode = async () => {
    try {
     // Don't set loading true on background refreshes to avoid flicker
     // only for first load if no token exists yet
      if (!qrToken) setLoading(true); 
      const response = await fetch(api.getNewQR, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": accessToken
        },
        body: JSON.stringify({ eventId: eventId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to generate QR");
      }

      // The backend returns { data: { qrCode: "..." } }
      const newCode = result.data?.qrCode;
      
      if (newCode) {
        setQrToken(newCode);
        setError("");
      }
    } catch (err) {
      console.error("QR Fetch Error:", err);
      // Only show error on screen if we don't have a QR code yet
      if (!qrToken) setError(err.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  // Combine Event ID and Token into the QR payload
  // This ensures the student app knows WHICH event this is for + the validation token
  const qrPayload = qrToken ? JSON.stringify({
    eventId: eventId,
    token: qrToken
  }) : "";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColors
            ? colors.backgroundColors[0]
            : "#fff",
        },
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.header }]}>
          Scan For Attendance
        </Text>
        
        <Text style={{ color: colors.textSecondary, marginBottom: 20, textAlign: 'center' }}>
          Ask students to scan this QR code. It updates automatically.
        </Text>

        <View style={[styles.qrContainer, { backgroundColor: '#fff' }]}>
          {loading && !qrToken ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : error ? (
            <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
          ) : (
            qrToken && (
              <View style={{ alignItems: 'center' }}>
                <QRCode
                  value={qrPayload}
                  size={width * 0.6}
                  backgroundColor="white"
                  color="black"
                />
                <Text style={{ marginTop: 15, fontSize: 16, color: colors.primary, fontWeight: 'bold' }}>
                  Updating in {timeLeft} seconds...
                </Text>
              </View>
            )
          )}
        </View>

        <TouchableOpacity 
          style={[styles.link, { marginTop: 30 }]} 
          onPress={() => goBack()}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 500,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "800", 
    marginBottom: 8,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.7,
    height: width * 0.85, // increased height slightly to fit timer
    maxWidth: 300,
    maxHeight: 350,
    borderWidth: 1,
    borderColor: '#eee',
  },
  link: {
    padding: 10,
  },
});