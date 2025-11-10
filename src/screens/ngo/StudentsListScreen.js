// ...existing code...
import React, { useContext, useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";

export default function StudentsListScreen({ college }) {
    const { goBack } = useContext(NavigationContext);
    const { darkMode, lightTheme, darkTheme } = useTheme();
    const colors = darkMode ? darkTheme : lightTheme;

    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("All Classes");
    const [classObjects, setClassObjects] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        // Normalize incoming college -> classes (handles className / name)
        console.log("StudentsListScreen college prop:", college);
        const clsArray = Array.isArray(college?.classes) ? college.classes : [];
        const normalized = clsArray
            .map((c) => {
                if (!c) return null;
                const students = Array.isArray(c.students) ? c.students : [];
                return {
                    _id: c._id || c.id || Math.random().toString(),
                    name: c.className || c.name || `Class ${c._id || ""}`,
                    students,
                };
            })
            .filter(Boolean);

        setClassObjects(normalized);
        setClasses(["All Classes", ...normalized.map((c) => c.name)]);
        setSelectedClass("All Classes");
    }, [college]);

    const renderStudentsForClass = (cls) => {
        const students = Array.isArray(cls.students) ? cls.students : [];
        if (students.length === 0) {
            return (
                <Text style={[styles.noStudents, { color: colors.textSecondary }]}>
                    No students in this class
                </Text>
            );
        }

        return students.map((student) => {
            const id = student._id || student.id || student.prn || Math.random().toString();
            const prn = student.prn || student.PRN || student.roll || student.regNo || "—";
            const dept = student.department || student.dept || "—";
            const name = student.name || student.fullName || "Unknown";

            return (
                <View key={id} style={[styles.row, { borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textPrimary }}>{name}</Text>
                        <Text style={{ color: colors.textSecondary }}>PRN: {prn}</Text>
                        <Text style={{ color: colors.textSecondary }}>Dept: {dept}</Text>
                    </View>
                </View>
            );
        });
    };

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
                style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
                <Text style={[styles.title, { color: colors.header }]}>
                    Students — {college?.name || college?.collegeName || "College"}
                </Text>

                {/* Vertical dropdown filter for classes */}
                <View style={{ marginBottom: 12 }}>
                    <TouchableOpacity
                        onPress={() => setShowDropdown((s) => !s)}
                        style={[
                            styles.dropdownToggle,
                            { borderColor: colors.border, backgroundColor: colors.iconBg },
                        ]}
                    >
                        <Text style={[styles.filterText, { color: colors.textPrimary }]}>
                            {selectedClass}
                        </Text>
                    </TouchableOpacity>

                    {showDropdown && (
                        <View
                            style={[
                                styles.dropdownList,
                                { borderColor: colors.border, backgroundColor: colors.cardBg },
                            ]}
                        >
                            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={true}>
                                {classes.map((className) => (
                                    <TouchableOpacity
                                        key={className}
                                        onPress={() => {
                                            setSelectedClass(className);
                                            setShowDropdown(false);
                                        }}
                                        style={[
                                            styles.dropdownItem,
                                            { borderColor: colors.border },
                                            selectedClass === className && {
                                                backgroundColor: colors.accent,
                                                borderColor: colors.accent,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.filterText,
                                                { color: colors.textPrimary },
                                                selectedClass === className && { color: "#fff" },
                                            ]}
                                        >
                                            {className}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                <View style={styles.list}>
                    {classObjects.length === 0 ? (
                        <Text style={[styles.error, { color: colors.textSecondary }]}>
                            No classes / students found
                        </Text>
                    ) : selectedClass === "All Classes" ? (
                        classObjects.map((cls) => (
                            <View key={cls._id} style={{ marginBottom: 12 }}>
                                <Text style={[styles.classHeader, { color: colors.header }]}>
                                    {cls.name}
                                </Text>
                                {renderStudentsForClass(cls)}
                            </View>
                        ))
                    ) : (
                        (() => {
                            const cls = classObjects.find((c) => c.name === selectedClass);
                            return cls ? (
                                <View>
                                    <Text style={[styles.classHeader, { color: colors.header }]}>
                                        {selectedClass}
                                    </Text>
                                    {renderStudentsForClass(cls)}
                                </View>
                            ) : (
                                <Text style={[styles.error, { color: colors.textSecondary }]}>
                                    No students found for {selectedClass}
                                </Text>
                            );
                        })()
                    )}
                </View>

                <TouchableOpacity style={styles.link} onPress={() => goBack()}>
                    <Text style={{ color: colors.textPrimary }}>Back</Text>
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
        maxWidth: 640,
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    filterContainer: {
        flexGrow: 0,
        marginBottom: 16,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    filterText: {
        fontWeight: "600",
    },
    list: {
        width: "100%",
    },
    classHeader: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 6,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    noStudents: {
        paddingVertical: 8,
    },
    loader: {
        marginTop: 20,
    },
    error: {
        textAlign: "center",
        marginTop: 20,
    },
    link: {
        marginTop: 12,
    },

    /* Dropdown styles */
    dropdownToggle: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    dropdownList: {
        marginTop: 8,
        borderRadius: 8,
        borderWidth: 1,
        overflow: "hidden",
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
});
// ...existing code...