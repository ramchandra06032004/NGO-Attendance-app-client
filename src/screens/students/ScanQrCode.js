import React, { useState, useEffect, useContext } from "react";
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
    Button
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { NavigationContext } from "../../context/NavigationContext";
import * as api from "../../../apis/api";

const { width } = Dimensions.get("window");

export default function ScanQrCode({ studentId, college }) {

    const { accessToken } = useContext(AuthContext);
    const { goBack } = useContext(NavigationContext);

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [location, setLocation] = useState(null);
    const [statusMessage, setStatusMessage] = useState("Position the QR code within the frame");

    console.log("ScanQrCode Params Received:", { studentId, college });

    useEffect(() => {
        (async () => {
            if (!permission) {
                requestPermission();
            }
            const loc = await getRobustLocation();
            if (loc) {
                setLocation(loc);
            } else {
                 console.log("Could not fetch initial location, will retry on scan.");
            }
        })();
    }, [permission]);

    const getRobustLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied. Location is required.');
                return null;
            }
            let locResult = await Location.getLastKnownPositionAsync({});
            if (!locResult) {
                locResult = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
            }

            if (locResult && locResult.coords) {
                return {
                    latitude: locResult.coords.latitude,
                    longitude: locResult.coords.longitude
                };
            }
            return null;
        } catch (error) {
            console.log("Location Error:", error);
            return null;
        }
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || loading) return;
        let freshLocation = location;
        if (!freshLocation) {
            setLoading(true); 
            freshLocation = await getRobustLocation();
            
            if (!freshLocation) {
                setLoading(false);
                Alert.alert("Location Error", "Could not fetch your location. Please ensure GPS is on and try again.");
                return;
            }
            setLocation(freshLocation);
        }

        setScanned(true);
        setLoading(true);
        setStatusMessage("Processing Attendance...");

        try {
            let qrData;
            try {
                qrData = JSON.parse(data);
            } catch (e) {
                throw new Error("Invalid QR Code format.");
            }

            const { eventId, token } = qrData;

            if (!eventId || !token) {
                throw new Error("Incomplete QR data. Please scan a valid Event QR.");
            }

            // 2. Prepare API Body
            const reqBody = {
                studentIds: [studentId],
                eventId: eventId,
                collegeId: college,
                qrCodeString: token,
                studentLocation: freshLocation
            };

            console.log("Sending Attendance Request:", reqBody);
            const response = await fetch(api.attendanceAPI, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": accessToken
                },
                body: JSON.stringify(reqBody)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || "Failed to mark attendance.");
            }
            setSuccess(true);
            setStatusMessage("Attendance Marked Successfully!");

        } catch (error) {
            console.error("Attendance Error:", error);
            Alert.alert(
                "Attendance Failed",
                error.message,
                [{
                    text: "Scan Again", onPress: () => {
                        setScanned(false);
                        setLoading(false);
                        setStatusMessage("Position the QR code within the frame");
                    }
                }]
            );
        } finally {
            // Only turn off loading if NOT successful (success view handles its own state)
            if (!success) setLoading(false);
        }
    };

    if (!permission) {
        return <View style={styles.container}><Text style={{ color: 'white' }}>Requesting permissions...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ textAlign: 'center', color: 'white', marginBottom: 20 }}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    // --- Success View ---
    if (success) {
        return (
            <View style={[styles.container, { backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' }]}>
                <View style={styles.successCard}>
                    <Ionicons name="checkmark-circle" size={120} color="#22c55e" />
                    <Text style={styles.successTitle}>Attendance Recorded!</Text>
                    <Text style={styles.successSub}>Your attendance has been successfully marked.</Text>

                    <TouchableOpacity style={styles.homeBtn} onPress={() => {
                        // Reset to scan again or go back
                        setScanned(false);
                        setSuccess(false);
                        setLoading(false);
                        setStatusMessage("Position the QR code within the frame");
                    }}>
                        <Text style={styles.btnText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Header / Overlay Message */}
            <View style={styles.header}>
                <Text style={styles.headerText}>{statusMessage}</Text>
            </View>

            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />

            {/* Frame Marker (Visual Guide) */}
            <View style={styles.overlay}>
                <View style={styles.unfocusedContainer}></View>
                <View style={styles.middleContainer}>
                    <View style={styles.unfocusedContainer}></View>
                    <View style={styles.focusedContainer}>
                        {!scanned && <View style={styles.cornerMarkers} />}
                        {loading && <ActivityIndicator size="large" color="#fff" />}
                    </View>
                    <View style={styles.unfocusedContainer}></View>
                </View>
                <View style={styles.unfocusedContainer}></View>
            </View>

            {/* Footer controls */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={() => goBack()} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    header: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
    },
    headerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        overflow: 'hidden'
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
    },
    cancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)'
    },
    cancelText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },

    // Overlay styles for focus area
    overlay: {
        flex: 1,
        flexDirection: 'column',
    },
    unfocusedContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    middleContainer: {
        flexDirection: 'row',
        flex: 1.5, // Height of the scan area
    },
    focusedContainer: {
        flex: 7, // Width of the scan area
        justifyContent: 'center',
        alignItems: 'center'
    },
    cornerMarkers: {
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: '#22c55e', // Green border for guidance
        backgroundColor: 'transparent',
        borderRadius: 12,
        borderStyle: 'dashed'
    },

    // Success Screen Styles
    successCard: {
        backgroundColor: 'white',
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        width: '85%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#15803d',
        marginTop: 24,
        marginBottom: 8
    },
    successSub: {
        textAlign: 'center',
        color: '#64748b',
        fontSize: 16,
        marginBottom: 32,
        lineHeight: 24
    },
    homeBtn: {
        backgroundColor: '#22c55e',
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 12,
        shadowColor: "#22c55e",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});