import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Switch,
    Text,
    View,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser, logoutUser, type User } from "@/lib/authService";

interface AdminProfileData extends User {
    total_sales?: number;
    active_listings?: number;
}

function formatDate(value?: string) {
    if (!value) {
        return "Not available";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Not available";
    }

    return parsed.toLocaleString();
}

function formatNumber(value?: number) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return "Not available";
    }

    return value.toLocaleString();
}

function getInitials(name?: string) {
    if (!name) {
        return "A";
    }

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");
}

export default function AdminProfile() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<AdminProfileData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(true);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getCurrentUser();

            if (response.success && response.data?.user) {
                setProfile(response.data.user as AdminProfileData);
            } else {
                setError("Unable to load admin profile.");
            }
        } catch (err) {
            setError("Unable to load admin profile.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [loadProfile]),
    );

    // Personal Information (editable by admin)
    const personalInfo = useMemo(() => {
        if (!profile) {
            return [];
        }

        return [
            { label: "Full Name", value: profile.name, icon: "person-outline" as const },
            { label: "Email Address", value: profile.email, icon: "mail-outline" as const },
            { label: "Faculty/Department", value: profile.faculty || "Not set", icon: "business-outline" as const },
            { label: "Graduation Year", value: profile.graduation_year ? String(profile.graduation_year) : "Not set", icon: "calendar-outline" as const },
            { label: "Avatar URL", value: profile.avatar_url || "No avatar set", icon: "image-outline" as const },
        ];
    }, [profile]);

    // System Information (read-only, from database)
    const systemInfo = useMemo(() => {
        if (!profile) {
            return [];
        }

        return [
            // { label: "Admin ID", value: profile.id, icon: "id-card-outline" as const },
            { label: "Role", value: profile.role, icon: "shield-outline" as const },
            { label: "Verification Status", value: profile.is_verified ? "Verified" : "Unverified", icon: "checkmark-circle-outline" as const },
            { label: "Account Status", value: profile.is_verified ? "Active" : "Pending", icon: "radio-button-on-outline" as const },
            { label: "Total Sales", value: formatNumber(profile.total_sales), icon: "trending-up-outline" as const },
            { label: "Active Listings", value: formatNumber(profile.active_listings), icon: "albums-outline" as const },
            { label: "Avg. Rating", value: typeof profile.rating === "number" ? `${profile.rating.toFixed(1)} / 5` : "Not rated", icon: "star-outline" as const },
            { label: "Joined Date", value: formatDate(profile.created_at), icon: "calendar-outline" as const },
            { label: "Last Updated", value: formatDate(profile.updated_at), icon: "time-outline" as const },
        ];
    }, [profile]);

    const summaryStats = useMemo(() => {
        if (!profile) {
            return [];
        }

        return [
            {
                label: "Total Sales",
                value: formatNumber(profile.total_sales ?? 0),
                icon: "cash-outline" as const,
                color: "#22d3ee",
            },
            {
                label: "Active Listings",
                value: formatNumber(profile.active_listings ?? 0),
                icon: "albums-outline" as const,
                color: "#a78bfa",
            },
            {
                label: "Avg. Rating",
                value: typeof profile.rating === "number" ? profile.rating.toFixed(1) : "N/A",
                icon: "star-outline" as const,
                color: "#fbbf24",
            },
            {
                label: "Verification",
                value: profile.is_verified ? "Verified" : "Pending",
                icon: "shield-checkmark-outline" as const,
                color: "#4ade80",
            },
        ];
    }, [profile]);

    const handleEditProfile = () => {
        router.push("/admin/dashboard");
    };

    const handleChangePassword = () => {
        router.push("/admin/dashboard");
    };

    const handleNotificationSettings = () => {
        router.push("/admin/dashboard");
    };

    const handlePrivacySettings = () => {
        router.push("/admin/dashboard");
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        // API call to delete account
                        Alert.alert("Account deleted", "Your account has been scheduled for deletion.");
                    }
                },
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logoutUser();
                        router.replace("/(auth)/SignIn" as never);
                    }
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            <View className="flex-row items-center px-5 py-4">
                <Pressable
                    onPress={() => router.back()}
                    className="items-center justify-center mr-3 rounded-full h-11 w-11 bg-white/10"
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </Pressable>
                <View>
                    <Text className="text-2xl text-white font-display-bold">
                        Admin Profile
                    </Text>
                    <Text className="text-slate-400 font-display">
                        Manage your account and preferences
                    </Text>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 24 }}
            >
                {loading ? (
                    <View className="items-center mt-20">
                        <ActivityIndicator color="#22d3ee" size="large" />
                        <Text className="mt-4 text-slate-300 font-display-medium">
                            Loading admin profile…
                        </Text>
                    </View>
                ) : error ? (
                    <View className="items-center mt-20">
                        <Text className="text-lg text-white font-display-semibold">
                            Profile unavailable
                        </Text>
                        <Text className="mt-2 text-center text-slate-400 font-display">
                            {error}
                        </Text>
                        <Pressable
                            onPress={loadProfile}
                            className="px-5 py-3 mt-5 rounded-2xl bg-cyan-500"
                        >
                            <Text className="text-slate-950 font-display-bold">
                                Retry
                            </Text>
                        </Pressable>
                    </View>
                ) : profile ? (
                    <>
                                {/* Header Section with Avatar */}
                                <View className="p-5 border rounded-3xl border-white/10 bg-slate-900">
                                    <View className="flex-row items-center">
                                        <View className="items-center justify-center w-20 h-20 mr-4 overflow-hidden rounded-3xl bg-cyan-500/10">
                                            {profile.avatar_url ? (
                                                <Image
                                                    source={{ uri: profile.avatar_url }}
                                                    className="w-20 h-20"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <Text className="text-2xl text-cyan-300 font-display-bold">
                                                    {getInitials(profile.name)}
                                                </Text>
                                            )}
                                        </View>

                                        <View className="flex-1">
                                            <Text className="text-2xl text-white font-display-bold">
                                                {profile.name}
                                            </Text>
                                            <Text className="mt-1 text-slate-300 font-display">
                                                {profile.email}
                                            </Text>
                                            <View className="flex-row flex-wrap gap-2 mt-3">
                                                <View className="px-3 py-2 rounded-full bg-cyan-500/10">
                                                    <Text className="text-xs text-cyan-300 font-display-semibold">
                                                        {profile.role}
                                                    </Text>
                                                </View>
                                                <View className="px-3 py-2 rounded-full bg-white/5">
                                                    <Text className="text-xs text-slate-300 font-display-semibold">
                                                        {profile.is_verified ? "Verified" : "Unverified"}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Quick Actions */}
                                    <View className="flex-row flex-wrap gap-3 mt-5">
                                        <Pressable
                                            onPress={handleEditProfile}
                                            className="flex-row items-center self-start px-4 py-3 rounded-2xl bg-white/5"
                                        >
                                            <Ionicons name="create-outline" size={18} color="#fff" />
                                            <Text className="ml-2 text-white font-display-semibold">
                                                Edit Profile
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={loadProfile}
                                            className="flex-row items-center self-start px-4 py-3 rounded-2xl bg-white/5"
                                        >
                                            <Ionicons name="refresh-outline" size={18} color="#fff" />
                                            <Text className="ml-2 text-white font-display-semibold">
                                                Refresh
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Stats Summary */}
                                <View className="flex-row flex-wrap justify-between mt-4 gap-y-3">
                                    {summaryStats.map((stat) => (
                                        <View
                                            key={stat.label}
                                            className="w-[48%] p-4 border rounded-3xl border-white/10 bg-slate-900"
                                        >
                                            <View className="items-center justify-center mb-3 w-11 h-11 rounded-2xl bg-white/5">
                                                <Ionicons name={stat.icon} size={22} color={stat.color} />
                                            </View>
                                            <Text className="text-xs uppercase tracking-[0.18em] text-slate-400 font-display-semibold">
                                                {stat.label}
                                            </Text>
                                            <Text className="mt-2 text-2xl text-white font-display-bold">
                                                {stat.value}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Personal Information Section */}
                                <View className="p-5 mt-4 border rounded-3xl border-white/10 bg-slate-900">
                                    <View className="flex-row items-center justify-between">
                                        <View>
                                            <Text className="text-lg text-white font-display-bold">
                                                Personal Information
                                            </Text>
                                            <Text className="mt-1 text-slate-400 font-display">
                                                Your personal details and contact information
                                            </Text>
                                        </View>
                                        <Pressable
                                            onPress={handleEditProfile}
                                            className="px-3 py-2 rounded-xl bg-cyan-500/20"
                                        >
                                            <Text className="text-sm text-cyan-300 font-display-semibold">
                                                Edit
                                            </Text>
                                        </Pressable>
                                    </View>

                                    <View className="mt-4">
                                        {personalInfo.map((info) => (
                                            <View
                                                key={info.label}
                                                className="flex-row items-center py-3 border-b border-white/5"
                                            >
                                                <Ionicons name={info.icon} size={20} color="#64748b" />
                                                <View className="flex-1 ml-3">
                                                    <Text className="text-xs text-slate-500 font-display">
                                                        {info.label}
                                                    </Text>
                                                    <Text className="text-sm text-white font-display-semibold">
                                                        {info.value}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* System Information Section */}
                                <View className="p-5 mt-4 border rounded-3xl border-white/10 bg-slate-900">
                                    <View>
                                        <Text className="text-lg text-white font-display-bold">
                                            System Information
                                        </Text>
                                        <Text className="mt-1 text-slate-400 font-display">
                                            Account metadata and platform statistics
                                        </Text>
                                    </View>

                                    <View className="mt-4">
                                        {systemInfo.map((info) => (
                                            <View
                                                key={info.label}
                                                className="flex-row items-center py-3 border-b border-white/5"
                                            >
                                                <Ionicons name={info.icon} size={20} color="#64748b" />
                                                <View className="flex-1 ml-3">
                                                    <Text className="text-xs text-slate-500 font-display">
                                                        {info.label}
                                                    </Text>
                                                    <Text className="text-sm text-white font-display-semibold">
                                                        {info.value}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Settings Section */}
                                <View className="p-5 mt-4 border rounded-3xl border-white/10 bg-slate-900">
                                    <Text className="text-lg text-white font-display-bold">
                                        Settings & Preferences
                                    </Text>
                                    <Text className="mt-1 text-slate-400 font-display">
                                        Configure your app experience
                                    </Text>

                                    <View className="mt-4">
                                        {/* Notifications */}
                                        <Pressable
                                            onPress={handleNotificationSettings}
                                            className="flex-row items-center justify-between py-4 border-b border-white/5"
                                        >
                                            <View className="flex-row items-center">
                                                <Ionicons name="notifications-outline" size={22} color="#64748b" />
                                                <Text className="ml-3 text-white font-display-medium">
                                                    Notifications
                                                </Text>
                                            </View>
                                            <Switch
                                                value={notificationsEnabled}
                                                onValueChange={setNotificationsEnabled}
                                                trackColor={{ false: "#475569", true: "#22d3ee" }}
                                                thumbColor="#ffffff"
                                            />
                                        </Pressable>

                                        {/* Dark Mode */}
                                        <Pressable
                                            onPress={() => setDarkModeEnabled(!darkModeEnabled)}
                                            className="flex-row items-center justify-between py-4 border-b border-white/5"
                                        >
                                            <View className="flex-row items-center">
                                                <Ionicons name="moon-outline" size={22} color="#64748b" />
                                                <Text className="ml-3 text-white font-display-medium">
                                                    Dark Mode
                                                </Text>
                                            </View>
                                            <Switch
                                                value={darkModeEnabled}
                                                onValueChange={setDarkModeEnabled}
                                                trackColor={{ false: "#475569", true: "#22d3ee" }}
                                                thumbColor="#ffffff"
                                            />
                                        </Pressable>

                                        {/* Change Password */}
                                        <Pressable
                                            onPress={handleChangePassword}
                                            className="flex-row items-center py-4 border-b border-white/5"
                                        >
                                            <Ionicons name="key-outline" size={22} color="#64748b" />
                                            <Text className="ml-3 text-white font-display-medium">
                                                Change Password
                                            </Text>
                                            <Ionicons name="chevron-forward" size={18} color="#64748b" style={{ marginLeft: "auto" }} />
                                        </Pressable>

                                        {/* Privacy Settings */}
                                        <Pressable
                                            onPress={handlePrivacySettings}
                                            className="flex-row items-center py-4 border-b border-white/5"
                                        >
                                            <Ionicons name="lock-closed-outline" size={22} color="#64748b" />
                                            <Text className="ml-3 text-white font-display-medium">
                                                Privacy & Security
                                            </Text>
                                            <Ionicons name="chevron-forward" size={18} color="#64748b" style={{ marginLeft: "auto" }} />
                                        </Pressable>

                                        {/* Data Export */}
                                        <Pressable
                                            onPress={() => Alert.alert("Export Data", "Your data export will be emailed to you shortly.")}
                                            className="flex-row items-center py-4 border-b border-white/5"
                                        >
                                            <Ionicons name="download-outline" size={22} color="#64748b" />
                                            <Text className="ml-3 text-white font-display-medium">
                                                Export My Data
                                            </Text>
                                            <Ionicons name="chevron-forward" size={18} color="#64748b" style={{ marginLeft: "auto" }} />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Danger Zone */}
                                <View className="p-5 mt-4 border rounded-3xl border-red-500/20 bg-red-500/5">
                                    <Text className="text-lg text-red-400 font-display-bold">
                                        Danger Zone
                                    </Text>
                                    <Text className="mt-1 text-red-400/70 font-display">
                                        Irreversible actions
                                    </Text>

                                    <View className="mt-4">
                                        <Pressable
                                            onPress={handleDeleteAccount}
                                            className="flex-row items-center py-4"
                                        >
                                            <Ionicons name="trash-outline" size={22} color="#f87171" />
                                            <Text className="ml-3 text-red-400 font-display-medium">
                                                Delete Account
                                            </Text>
                                            <Ionicons name="chevron-forward" size={18} color="#f87171" style={{ marginLeft: "auto" }} />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Logout Button */}
                                <View className="mt-6">
                                    <Pressable
                                        onPress={handleLogout}
                                        className="flex-row items-center justify-center py-4 rounded-2xl bg-red-500/20"
                                    >
                                        <Ionicons name="log-out-outline" size={22} color="#fca5a5" />
                                        <Text className="ml-2 text-lg font-semibold text-red-200">
                                            Logout
                                        </Text>
                                    </Pressable>
                                </View>
                    </>
                ) : (
                    <View className="items-center mt-20">
                        <Text className="text-lg text-white font-display-semibold">
                            No profile data
                        </Text>
                        <Text className="mt-2 text-center text-slate-400 font-display">
                            The current session did not return an admin account.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}