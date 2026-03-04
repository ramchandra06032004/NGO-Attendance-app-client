import React, { useContext } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";

export default function EntityDetailScreen({ entity, entityType }) {
    const { goBack } = useContext(NavigationContext);
    const { darkMode, lightTheme, darkTheme } = useTheme();
    const colors = darkMode ? darkTheme : lightTheme;

    const renderName = () => {
        if (typeof entity === "string") return entity;
        return entity?.name || entity?.title || entity?.email || "Unknown";
    };

    const getInitials = (name) => {
        if (!name) return "?";
        const words = name.trim().split(/\s+/);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const name = renderName();
    const logoUrl = entity?.logo || entity?.logoUrl || entity?.profileImage;

    // Render field if it exists
    const renderField = (label, value) => {
        if (!value || value === "" || value === null || value === undefined) return null;

        return (
            <View className="mb-3">
                <Text className="text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
                    {label.toUpperCase()}
                </Text>
                <Text className="text-base" style={{ color: colors.textPrimary }}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </Text>
            </View>
        );
    };

    return (
        <View
            className="flex-1"
            style={{
                backgroundColor: colors.backgroundColors?.[0] || "#f0fdf4",
            }}
        >
            {/* Header */}
            <View className="px-5 pt-8 pb-4" style={{ backgroundColor: colors.cardBg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <TouchableOpacity
                    onPress={() => goBack()}
                    className="px-4 py-2 rounded-xl border mb-3 self-start"
                    style={{
                        borderColor: colors.border,
                        backgroundColor: colors.backgroundColors?.[0] || '#fff',
                    }}
                >
                    <Text className="font-semibold" style={{ color: colors.textPrimary }}>← Back</Text>
                </TouchableOpacity>

                <View className="flex-row items-center mb-2">
                    <View
                        className="w-16 h-16 rounded-full items-center justify-center mr-4 overflow-hidden"
                        style={{ backgroundColor: colors.accent + '20', borderWidth: 2, borderColor: colors.accent + '30' }}
                    >
                        {logoUrl ? (
                            <Image
                                source={{ uri: logoUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="font-bold text-xl" style={{ color: colors.accent }}>
                                {getInitials(name)}
                            </Text>
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="text-2xl font-extrabold mb-1" style={{ color: colors.header }}>
                            {name}
                        </Text>
                        <View className="px-3 py-1 rounded-lg self-start" style={{ backgroundColor: colors.accent + '15' }}>
                            <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                                {entityType === 'college' ? 'COLLEGE' : 'NGO'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Details */}
            <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={true}>
                <View className="p-4 rounded-xl border mb-4" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
                    <Text className="text-lg font-bold mb-4" style={{ color: colors.header }}>
                        Details
                    </Text>

                    {renderField("Name", entity?.name)}
                    {renderField("Email", entity?.email)}
                    {renderField("Contact", entity?.contact || entity?.phone || entity?.phoneNumber)}
                    {renderField("Address", entity?.address)}
                    {renderField("City", entity?.city)}
                    {renderField("State", entity?.state)}
                    {renderField("Pincode", entity?.pincode || entity?.zipCode)}
                    {renderField("Registration Number", entity?.registrationNumber || entity?.regNo)}
                    {renderField("Established", entity?.established || entity?.foundedYear)}
                    {renderField("Website", entity?.website)}
                    {renderField("Description", entity?.description || entity?.about)}

                    {/* College-specific fields */}
                    {entityType === 'college' && (
                        <>
                            {renderField("University", entity?.university)}
                            {renderField("Affiliation", entity?.affiliation)}
                            {renderField("Total Classes", entity?.classes?.length)}
                            {entity?.classes && entity.classes.length > 0 && (
                                <View className="mb-3">
                                    <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                                        CLASSES
                                    </Text>
                                    {entity.classes.map((cls, index) => (
                                        <View
                                            key={cls._id || index}
                                            className="px-3 py-2 rounded-lg mb-2 border"
                                            style={{ backgroundColor: colors.backgroundColors?.[0], borderColor: colors.border }}
                                        >
                                            <Text className="font-semibold" style={{ color: colors.textPrimary }}>
                                                {cls.className || cls.name}
                                            </Text>
                                            {cls.students && (
                                                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                                                    {cls.students.length} students
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                    {/* NGO-specific fields */}
                    {entityType === 'ngo' && (
                        <>
                            {renderField("Registration Type", entity?.registrationType)}
                            {renderField("Cause", entity?.cause || entity?.focus)}
                            {renderField("Members", entity?.members?.length || entity?.memberCount)}
                        </>
                    )}

                    {/* Additional metadata */}
                    {renderField("Created At", entity?.createdAt ? new Date(entity.createdAt).toLocaleDateString() : null)}
                    {renderField("Updated At", entity?.updatedAt ? new Date(entity.updatedAt).toLocaleDateString() : null)}
                </View>
            </ScrollView>
        </View>
    );
}
