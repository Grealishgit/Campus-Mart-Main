import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Switch,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentUser, logoutUser, type User } from "@/lib/authService";

interface ProfileData extends User {
    total_sales?: number;
    active_listings?: number;
    phone?: string;
}

function formatDate(value?: string) {
    if (!value) return "Not available";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not available";
    return parsed.toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
}

function formatNumber(value?: number) {
    if (typeof value !== "number" || Number.isNaN(value)) return "0";
    return value.toLocaleString();
}

function getInitials(name?: string) {
    if (!name) return "U";
    return name.split(" ").filter(Boolean).slice(0, 2)
        .map((p) => p[0]?.toUpperCase() || "").join("");
}

// ─── Role-aware colour tokens ────────────────────────────────
const ROLE_THEME = {
    student: { accent: "#6769ef", accentMuted: "#6769ef20", accentText: "#a5b4fc", badge: "Student" },
    vendor: { accent: "#f59e0b", accentMuted: "#f59e0b20", accentText: "#fcd34d", badge: "Vendor" },
    admin: { accent: "#22d3ee", accentMuted: "#22d3ee20", accentText: "#67e8f9", badge: "Admin" },
} as const;

function useRoleTheme(role?: string) {
    const key = (role ?? "student") as keyof typeof ROLE_THEME;
    return ROLE_THEME[key] ?? ROLE_THEME.student;
}

export default function UserProfile() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notifications, setNotifications] = useState(true);

    const loadProfile = useCallback(async () => {
        setLoading(true);
      setError(null);
      try {
          const response = await getCurrentUser();
          if (response.success && response.data?.user) {
            setProfile(response.data.user as ProfileData);
        } else {
            setError("Unable to load profile.");
        }
      } catch {
          setError("Unable to load profile.");
        } finally {
          setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

    const theme = useRoleTheme(profile?.role);

    // ─── Personal info rows ───────────────────────────────────
    const personalInfo = useMemo(() => {
      if (!profile) return [];
      const rows = [
          { label: "Full Name", value: profile.name, icon: "person-outline" as const },
        { label: "Email", value: profile.email, icon: "mail-outline" as const },
    ];
      if (profile.role === "student") {
          rows.push(
              { label: "Faculty", value: profile.faculty || "Not set", icon: "school-outline" as const },
          );
      }
      if (profile.role === "vendor") {
          rows.push(
              { label: "Location", value: profile.location || "Not set", icon: "location-outline" as const },
          );
      }
      if (profile.avatar_url) {
          rows.push({ label: "Avatar", value: profile.avatar_url, icon: "image-outline" as const });
      }
      return rows;
    }, [profile]);

    // ─── Account stats rows ───────────────────────────────────
    const accountInfo = useMemo(() => {
        if (!profile) return [];
        return [
        { label: "Role", value: profile.role, icon: "shield-outline" as const },
          { label: "Verified", value: profile.is_verified ? "Yes" : "No", icon: "checkmark-circle-outline" as const },
          { label: "Rating", value: typeof profile.rating === "number" ? `${profile.rating.toFixed(1)} / 5` : "Not rated", icon: "star-outline" as const },
          { label: "Member since", value: formatDate(profile.created_at), icon: "calendar-outline" as const },
      ];
  }, [profile]);

    // ─── Summary stats (role-aware) ────────────────────────────
    const summaryStats = useMemo(() => {
      if (!profile) return [];
      const base = [
          { label: "Rating", value: typeof profile.rating === "number" ? profile.rating.toFixed(1) : "N/A", icon: "star-outline" as const, color: "#fbbf24" },
          { label: "Verified", value: profile.is_verified ? "Yes" : "No", icon: "shield-checkmark-outline" as const, color: "#4ade80" },
      ];
      if (profile.role !== "student") {
          base.unshift(
              { label: "Sales", value: formatNumber(profile.total_sales), icon: "cash-outline" as const, color: theme.accent },
              { label: "Listings", value: formatNumber(profile.active_listings), icon: "albums-outline" as const, color: "#a78bfa" },
          );
      }
      return base;
  }, [profile, theme]);

    // ─── Role-aware action buttons ────────────────────────────
    const actionButtons = useMemo(() => {
        if (!profile) return [];
        const common = [
            { label: "Edit Profile", icon: "create-outline" as const, onPress: () => router.push("/profile/edit" as never) },
            { label: "Change Password", icon: "key-outline" as const, onPress: () => router.push("/profile/change-password" as never) },
        ];
        if (profile.role === "student") {
        return [
              ...common,
              { label: "My Orders", icon: "bag-handle-outline" as const, onPress: () => router.push("/(tabs)/orders" as never) },
              { label: "Saved Items", icon: "heart-outline" as const, onPress: () => router.push("/(tabs)/saved" as never) },
          ];
      }
      if (profile.role === "vendor") {
          return [
              ...common,
              { label: "My Listings", icon: "albums-outline" as const, onPress: () => router.push("/(tabs)/listings" as never) },
              { label: "Sales", icon: "trending-up-outline" as const, onPress: () => router.push("/(tabs)/sales" as never) },
              { label: "Payouts", icon: "wallet-outline" as const, onPress: () => router.push("/vendor/payouts" as never) },
          ];
      }
      // admin
      return [
          ...common,
          { label: "Dashboard", icon: "grid-outline" as const, onPress: () => router.push("/admin/dashboard" as never) },
          { label: "Manage Users", icon: "people-outline" as const, onPress: () => router.push("/admin/users" as never) },
          { label: "Reports", icon: "bar-chart-outline" as const, onPress: () => router.push("/admin/reports" as never) },
      ];
    }, [profile]);

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
            text: "Logout", style: "destructive", onPress: async () => {
                await logoutUser();
                router.replace("/(auth)/SignIn" as never);
            }
        },
    ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
        "Delete Account",
        "This action is permanent and cannot be undone.",
        [
            { text: "Cancel", style: "cancel" },
            {
                  text: "Delete", style: "destructive", onPress: () =>
                      Alert.alert("Scheduled", "Your account has been scheduled for deletion.")
              },
          ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
          {/* Header */}
          <View className="flex-row items-center px-5 py-4">
              <Pressable
                  onPress={() => router.back()}
                  className="items-center justify-center mr-3 rounded-full h-11 w-11 bg-white/10"
              >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
              </Pressable>
              <View>
                  <Text className="text-2xl text-white font-display-bold">My Profile</Text>
                  <Text className="text-slate-400 font-display">Manage your account</Text>
              </View>
          </View>

          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
              {loading ? (
                  <View className="items-center mt-20">
                      <ActivityIndicator color={theme.accent} size="large" />
                      <Text className="mt-4 text-slate-300 font-display-medium">Loading profile…</Text>
                  </View>
              ) : error ? (
                  <View className="items-center mt-20">
                          <Text className="text-lg text-white font-display-semibold">Profile unavailable</Text>
                          <Text className="mt-2 text-center text-slate-400 font-display">{error}</Text>
                          <Pressable onPress={loadProfile} className="px-5 py-3 mt-5 rounded-2xl" style={{ backgroundColor: theme.accent }}>
                              <Text className="font-display-bold text-slate-950">Retry</Text>
                          </Pressable>
                      </View>
                  ) : profile ? (
                      <>
                              {/* Avatar + identity card */}
                              <View className="p-5 border rounded-3xl border-white/10 bg-slate-900">
                                  <View className="flex-row items-center">
                                      <View
                                          className="items-center justify-center w-20 h-20 mr-4 overflow-hidden rounded-3xl"
                                          style={{ backgroundColor: theme.accentMuted }}
                                      >
                                          {profile.avatar_url ? (
                                              <Image source={{ uri: profile.avatar_url }} className="w-20 h-20" resizeMode="cover" />
                                          ) : (
                                              <Text className="text-2xl font-display-bold" style={{ color: theme.accentText }}>
                                                  {getInitials(profile.name)}
                                              </Text>
                                          )}
                                      </View>

                                      <View className="flex-1">
                                          <Text className="text-2xl text-white font-display-bold">{profile.name}</Text>
                                          <Text className="mt-1 text-slate-300 font-display" numberOfLines={1}>{profile.email}</Text>
                                          <View className="flex-row flex-wrap gap-2 mt-3">
                                              <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: theme.accentMuted }}>
                                                  <Text className="text-xs font-display-semibold" style={{ color: theme.accentText }}>
                                                      {theme.badge}
                                                  </Text>
                                              </View>
                                              <View className="px-3 py-1.5 rounded-full bg-white/5">
                                                  <Text className="text-xs text-slate-300 font-display-semibold">
                                                      {profile.is_verified ? "✓ Verified" : "Unverified"}
                                                  </Text>
                                              </View>
                                          </View>
                                      </View>
                                  </View>

                                  {/* Quick action strip */}
                                  <View className="flex-row gap-3 mt-5">
                                      <Pressable
                                          onPress={() => router.push("/profile/edit" as never)}
                                          className="flex-row items-center flex-1 px-4 py-3 rounded-2xl bg-white/5"
                                      >
                                          <Ionicons name="create-outline" size={18} color="#fff" />
                                          <Text className="ml-2 text-white font-display-semibold">Edit Profile</Text>
                                      </Pressable>
                                      <Pressable
                                          onPress={loadProfile}
                                          className="items-center justify-center w-12 rounded-2xl bg-white/5"
                                      >
                                          <Ionicons name="refresh-outline" size={20} color="#94a3b8" />
                                      </Pressable>
                                  </View>
                              </View>

                              {/* Stats grid — hidden for students */}
                              {summaryStats.length > 0 && (
                                  <View className="flex-row flex-wrap justify-between mt-4 gap-y-3">
                                      {summaryStats.map((stat) => (
                          <View key={stat.label} className="w-[48%] p-4 border rounded-3xl border-white/10 bg-slate-900">
                              <View className="items-center justify-center mb-3 w-11 h-11 rounded-2xl bg-white/5">
                                  <Ionicons name={stat.icon} size={22} color={stat.color} />
                              </View>
                              <Text className="text-xs tracking-widest uppercase text-slate-400 font-display-semibold">{stat.label}</Text>
                              <Text className="mt-1 text-2xl text-white font-display-bold">{stat.value}</Text>
                          </View>
                      ))}
                                  </View>
                              )}

                              {/* Role-specific action buttons */}
                              <View className="p-5 mt-4 border rounded-3xl border-white/10 bg-slate-900">
                                  <Text className="mb-4 text-lg text-white font-display-bold">Quick Actions</Text>
                                  {actionButtons.map((btn, i) => (
                                      <Pressable
                            key={btn.label}
                            onPress={btn.onPress}
                            className={`flex-row items-center py-4 ${i < actionButtons.length - 1 ? "border-b border-white/5" : ""}`}
                        >
                            <View className="items-center justify-center w-9 h-9 rounded-xl bg-white/5">
                                <Ionicons name={btn.icon} size={20} color={theme.accentText} />
                            </View>
                            <Text className="flex-1 ml-3 text-white font-display-medium">{btn.label}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#475569" />
                        </Pressable>
                    ))}
                              </View>

                              {/* Personal information */}
                              <View className="p-5 mt-4 border rounded-3xl border-white/10 bg-slate-900">
                                  <View className="flex-row items-center justify-between mb-4">
                                      <Text className="text-lg text-white font-display-bold">Personal Information</Text>
                                      <Pressable
                                          onPress={() => router.push("/profile/edit" as never)}
                                          className="px-3 py-1.5 rounded-xl"
                                          style={{ backgroundColor: theme.accentMuted }}
                                      >
                                          <Text className="text-sm font-display-semibold" style={{ color: theme.accentText }}>Edit</Text>
                                      </Pressable>
                                  </View>
                                  {personalInfo.map((info, i) => (
                                      <View key={info.label} className={`flex-row items-center py-3 ${i < personalInfo.length - 1 ? "border-b border-white/5" : ""}`}>
                            <Ionicons name={info.icon} size={20} color="#64748b" />
                            <View className="flex-1 ml-3">
                                <Text className="text-xs text-slate-500 font-display">{info.label}</Text>
                                <Text className="text-sm text-white font-display-semibold" numberOfLines={1}>{info.value}</Text>
                            </View>
                        </View>
                    ))}
                              </View>

                              {/* Account details */}
                              <View className="p-5 mt-4 border rounded-3xl border-white/10 bg-slate-900">
                                  <Text className="mb-4 text-lg text-white font-display-bold">Account Details</Text>
                                  {accountInfo.map((info, i) => (
                                      <View key={info.label} className={`flex-row items-center py-3 ${i < accountInfo.length - 1 ? "border-b border-white/5" : ""}`}>
                                          <Ionicons name={info.icon} size={20} color="#64748b" />
                                          <View className="flex-1 ml-3">
                                <Text className="text-xs text-slate-500 font-display">{info.label}</Text>
                                <Text className="text-sm text-white capitalize font-display-semibold">{info.value}</Text>
                            </View>
                        </View>
                    ))}
                              </View>

                              {/* Preferences */}
                              <View className="p-5 mt-4 border rounded-3xl border-white/10 bg-slate-900">
                                  <Text className="mb-4 text-lg text-white font-display-bold">Preferences</Text>

                                  <View className="flex-row items-center justify-between py-4 border-b border-white/5">
                                      <View className="flex-row items-center">
                                          <Ionicons name="notifications-outline" size={22} color="#64748b" />
                                          <Text className="ml-3 text-white font-display-medium">Notifications</Text>
                                      </View>
                                      <Switch
                                          value={notifications}
                                          onValueChange={setNotifications}
                                          trackColor={{ false: "#475569", true: theme.accent }}
                                          thumbColor="#ffffff"
                                      />
                                  </View>

                                  <Pressable
                                      onPress={() => router.push("/profile/change-password" as never)}
                                      className="flex-row items-center py-4 border-b border-white/5"
                                  >
                                      <Ionicons name="key-outline" size={22} color="#64748b" />
                                      <Text className="ml-3 text-white font-display-medium">Change Password</Text>
                                      <Ionicons name="chevron-forward" size={18} color="#64748b" style={{ marginLeft: "auto" }} />
                                  </Pressable>

                                  <Pressable
                                      onPress={() => router.push("/profile/privacy" as never)}
                                      className="flex-row items-center py-4"
                                  >
                                      <Ionicons name="lock-closed-outline" size={22} color="#64748b" />
                                      <Text className="ml-3 text-white font-display-medium">Privacy & Security</Text>
                                      <Ionicons name="chevron-forward" size={18} color="#64748b" style={{ marginLeft: "auto" }} />
                                  </Pressable>
                              </View>

                              {/* Danger zone */}
                              <View className="p-5 mt-4 border rounded-3xl border-red-500/20 bg-red-500/5">
                                  <Text className="mb-4 text-lg text-red-400 font-display-bold">Danger Zone</Text>
                                  <Pressable onPress={handleDeleteAccount} className="flex-row items-center py-2">
                                      <Ionicons name="trash-outline" size={22} color="#f87171" />
                                      <Text className="ml-3 text-red-400 font-display-medium">Delete Account</Text>
                                      <Ionicons name="chevron-forward" size={18} color="#f87171" style={{ marginLeft: "auto" }} />
                                  </Pressable>
                              </View>

                              {/* Logout */}
                              <Pressable
                                  onPress={handleLogout}
                                  className="flex-row items-center justify-center py-4 mt-4 rounded-2xl bg-red-500/20"
                              >
                                  <Ionicons name="log-out-outline" size={22} color="#fca5a5" />
                                  <Text className="ml-2 text-lg font-semibold text-red-200">Logout</Text>
                              </Pressable>
                          </>
                      ) : (
                          <View className="items-center mt-20">
                                  <Text className="text-lg text-white font-display-semibold">No profile data</Text>
                                  <Text className="mt-2 text-center text-slate-400 font-display">
                          The current session did not return a user account.
                      </Text>
                  </View>
              )}
          </ScrollView>
      </SafeAreaView>
    );
}