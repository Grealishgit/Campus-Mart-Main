import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deleteAdminUser,
  getAdminUsers,
  verifyAdminUser,
  type AdminUser,
} from "@/lib/adminService";

type UserFilter = "all" | "today" | "unverified";

function isRegisteredToday(createdAt?: string) {
  if (!createdAt) {
    return false;
  }

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}

export default function AdminUsersScreen() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activeFilter, setActiveFilter] = useState<UserFilter>("all");

  const loadUsers = useCallback(
    async (term?: string) => {
      setLoading(true);

      try {
        const response = await getAdminUsers(term ?? search);

        if (response.success && response.data?.users) {
          setUsers(response.data.users);
        }
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  const totalUsers = users.length;
  const usersToday = useMemo(
    () => users.filter((user) => isRegisteredToday(user.created_at)).length,
    [users],
  );
  const unverifiedUsers = useMemo(
    () => users.filter((user) => !user.is_verified).length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (activeFilter === "today") {
        return isRegisteredToday(user.created_at);
      }

      if (activeFilter === "unverified") {
        return !user.is_verified;
      }

      return true;
    });
  }, [activeFilter, users]);

  const filterCards = [
    {
      key: "all" as const,
      label: "Total users",
      value: totalUsers,
      icon: "people-outline" as const,
    },
    {
      key: "today" as const,
      label: "Registered today",
      value: usersToday,
      icon: "today-outline" as const,
    },
    {
      key: "unverified" as const,
      label: "Unverified",
      value: unverifiedUsers,
      icon: "alert-circle-outline" as const,
    },
  ];

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
            User Management
          </Text>
          <Text className="text-slate-400 font-display">
            Verify and moderate users.
          </Text>
        </View>
      </View>

      <View className="px-5 pb-4">
        <View className="flex-row gap-3">
          {filterCards.map((card) => {
            const isActive = activeFilter === card.key;

            return (
              <Pressable
                key={card.key}
                onPress={() => setActiveFilter(card.key)}
                className={`flex-1 rounded-3xl border p-4 ${isActive
                    ? "border-cyan-400/60 bg-cyan-500/10"
                    : "border-white/10 bg-slate-900"
                  }`}
              >
                <View className="items-center justify-center mb-3 w-11 h-11 rounded-2xl bg-white/5">
                  <Ionicons
                    name={card.icon}
                    size={22}
                    color={isActive ? "#22d3ee" : "#cbd5e1"}
                  />
                </View>
                <Text className="text-xs uppercase tracking-[0.18em] text-slate-400 font-display-semibold">
                  {card.label}
                </Text>
                <Text className="mt-2 text-2xl text-white font-display-bold">
                  {card.value}
                </Text>
                <Text className="mt-1 text-xs text-slate-500 font-display">
                  Tap to filter
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="px-5 pb-4">
        <View className="flex-row items-center px-4 border rounded-2xl border-white/10 bg-slate-900">
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 px-3 py-4 text-white font-display"
            placeholder="Search by name or email"
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadUsers(search)}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {loading ? (
          <View className="items-center mt-20">
            <ActivityIndicator color="#22d3ee" size="large" />
          </View>
        ) : filteredUsers.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <Text className="text-lg text-white font-display-semibold">
              No users found
            </Text>
            <Text className="mt-2 text-center text-slate-400 font-display">
              Try a different filter or search term.
            </Text>
          </View>
        ) : (
              filteredUsers.map((user) => (
            <View
              key={user.id}
              className="p-4 mb-4 border rounded-3xl border-white/10 bg-slate-900"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-xl text-white font-display-bold">
                    {user.name}
                  </Text>
                  <Text className="mt-1 text-slate-300 font-display">
                    {user.email}
                  </Text>
                  <Text className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400 font-display-semibold">
                    {user.role} · {user.is_verified ? "verified" : "unverified"}
                  </Text>
                </View>
                <View className="px-3 py-2 rounded-full bg-white/5">
                  <Text className="text-xs text-cyan-300 font-display-semibold">
                    {user.active_listings ?? 0} active
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3 mt-4">
                {!user.is_verified && (
                  <Pressable
                    onPress={async () => {
                      const response = await verifyAdminUser(user.id);
                      if (!response.success) {
                        Alert.alert(
                          "Unable to verify",
                          response.error || "Try again.",
                        );
                        return;
                      }
                      loadUsers();
                    }}
                    className="items-center flex-1 py-3 rounded-2xl bg-cyan-500"
                  >
                    <Text className="text-slate-950 font-display-bold">
                      Verify
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      "Delete user",
                      `Remove ${user.name} from the marketplace?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            const response = await deleteAdminUser(user.id);
                            if (!response.success) {
                              Alert.alert(
                                "Delete failed",
                                response.error || "Try again.",
                              );
                              return;
                            }
                            loadUsers();
                          },
                        },
                      ],
                    )
                  }
                  className="items-center flex-1 py-3 border rounded-2xl border-red-500/40 bg-red-500/10"
                >
                  <Text className="text-red-300 font-display-bold">Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
