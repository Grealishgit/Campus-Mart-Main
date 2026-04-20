import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  deleteAdminUser,
  getAdminUsers,
  verifyAdminUser,
  type AdminUser,
} from "@/lib/adminService";

export default function AdminUsersScreen() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);

  const loadUsers = useCallback(async (term?: string) => {
    setLoading(true);
    const response = await getAdminUsers(term ?? search);

    if (response.success && response.data?.users) {
      setUsers(response.data.users);
    }

    setLoading(false);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-row items-center px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-white/10"
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
        <View className="flex-row items-center rounded-2xl border border-white/10 bg-slate-900 px-4">
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

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <View className="mt-20 items-center">
            <ActivityIndicator color="#22d3ee" size="large" />
          </View>
        ) : (
          users.map((user) => (
            <View
              key={user.id}
              className="mb-4 rounded-3xl border border-white/10 bg-slate-900 p-4"
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
                <View className="rounded-full bg-white/5 px-3 py-2">
                  <Text className="text-xs text-cyan-300 font-display-semibold">
                    {user.active_listings ?? 0} active
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row gap-3">
                {!user.is_verified && (
                  <Pressable
                    onPress={async () => {
                      const response = await verifyAdminUser(user.id);
                      if (!response.success) {
                        Alert.alert("Unable to verify", response.error || "Try again.");
                        return;
                      }
                      loadUsers();
                    }}
                    className="flex-1 items-center rounded-2xl bg-cyan-500 py-3"
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
                  className="flex-1 items-center rounded-2xl border border-red-500/40 bg-red-500/10 py-3"
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
