import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
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

    const detailCards = useMemo(() => {
        if (!profile) {
            return [];
        }

        return [
            { label: "Admin ID", value: profile.id },
            { label: "Name", value: profile.name },
            { label: "Email", value: profile.email },
            { label: "Role", value: profile.role },
            {
                label: "Verification",
                value: profile.is_verified ? "Verified" : "Unverified",
            },
            { label: "Faculty", value: profile.faculty || "Not set" },
            {
                label: "Graduation Year",
                value: profile.graduation_year
                    ? String(profile.graduation_year)
                    : "Not set",
            },
            {
                label: "Rating",
                value:
                    typeof profile.rating === "number"
                        ? `${profile.rating.toFixed(1)} / 5`
                        : "Not rated",
            },
            {
                label: "Total Sales",
                value: formatNumber(profile.total_sales),
            },
            {
                label: "Active Listings",
                value: formatNumber(profile.active_listings),
            },
            {
                label: "Joined",
                value: formatDate(profile.created_at),
            },
            {
                label: "Last updated",
                value: formatDate(profile.updated_at),
            },
            {
                label: "Avatar URL",
                value: profile.avatar_url || "No avatar set",
            },
        ];
    }, [profile]);

    const summaryCards = useMemo(() => {
        if (!profile) {
            return [];
        }

        return [
            {
                label: "Account status",
                value: profile.is_verified ? "Verified" : "Pending",
                icon: "shield-checkmark-outline" as const,
            },
            {
                label: "Listings",
                value: formatNumber(profile.active_listings ?? 0),
                icon: "albums-outline" as const,
            },
            {
                label: "Sales",
                value: formatNumber(profile.total_sales ?? 0),
                icon: "cash-outline" as const,
            },
            {
                label: "Rating",
                value:
                    typeof profile.rating === "number"
                        ? profile.rating.toFixed(1)
                        : "N/A",
                icon: "star-outline" as const,
            },
        ];
    }, [profile]);

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
                      Full account details from the database.
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

                          <View className="flex-row flex-wrap gap-3 mt-5">
                              <Pressable
                                  onPress={loadProfile}
                                  className="flex-row items-center self-start px-4 py-3 rounded-2xl bg-white/5"
                              >
                                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                                  <Text className="ml-2 text-white font-display-semibold">
                                      Refresh profile
                                  </Text>
                              </Pressable>

                              <Pressable
                                  onPress={async () => {
                                      await logoutUser();
                                      router.replace("/admin/login" as never);
                                  }}
                                  className="flex-row items-center self-start px-4 py-3 rounded-2xl bg-red-500/15"
                              >
                                  <Ionicons name="log-out-outline" size={18} color="#fca5a5" />
                                  <Text className="ml-2 text-red-200 font-display-semibold">
                                      Logout
                                  </Text>
                              </Pressable>
                          </View>
                      </View>

                      <View className="flex-row flex-wrap justify-between mt-4 gap-y-3">
                          {summaryCards.map((card) => (
                              <View
                                  key={card.label}
                                  className="w-[48%] p-4 border rounded-3xl border-white/10 bg-slate-900"
                              >
                                  <View className="items-center justify-center mb-3 w-11 h-11 rounded-2xl bg-white/5">
                                      <Ionicons name={card.icon} size={22} color="#22d3ee" />
                                  </View>
                                  <Text className="text-xs uppercase tracking-[0.18em] text-slate-400 font-display-semibold">
                                      {card.label}
                                  </Text>
                                  <Text className="mt-2 text-2xl text-white font-display-bold">
                                      {card.value}
                                  </Text>
                              </View>
                          ))}
                      </View>

                      <View className="p-5 mt-4 border rounded-3xl border-white/10 bg-slate-900">
                          <Text className="text-lg text-white font-display-bold">
                              Database details
                          </Text>
                          <Text className="mt-1 text-slate-400 font-display">
                              Every available admin field returned by the backend.
                          </Text>

                          <View className="mt-4">
                              {detailCards.map((detail) => (
                                  <View
                                      key={detail.label}
                                      className="flex-row justify-between py-3 border-b border-white/5"
                                  >
                                      <Text className="pr-3 text-slate-400 font-display">
                                          {detail.label}
                                      </Text>
                                      <Text className="flex-1 text-right text-white font-display-semibold">
                                          {detail.value}
                                      </Text>
                                  </View>
                              ))}
                          </View>
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
