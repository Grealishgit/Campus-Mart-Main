import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { getAdminStats } from "@/lib/adminService";
import { logoutUser } from "@/lib/authService";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  const loadDashboard = async () => {
    // console.log('🔄 loadDashboard fired');
    setLoading(true);
    const response = await getAdminStats();


    
    if (response.success && response.data?.stats) {
      setStats(response.data.stats);
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  const cards = [
    { label: "Users", value: stats.totalUsers, icon: "people-outline" as const },
    {
      label: "Listings",
      value: stats.totalListings,
      icon: "pricetags-outline" as const,
    },
    {
      label: "Orders",
      value: stats.totalOrders,
      icon: "receipt-outline" as const,
    },
    {
      label: "Revenue",
      value: `KES ${stats.totalRevenue.toLocaleString()}`,
      icon: "cash-outline" as const,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-row items-center justify-between mt-5 mb-8">
          <View>
            <Text className="text-sm uppercase tracking-[0.25em] text-cyan-300 font-display-bold">
              Admin Console
            </Text>
            <Text className="mt-2 text-3xl text-white font-display-bold">
              Marketplace control center
            </Text>
          </View>

          <Pressable
            onPress={async () => {
              await logoutUser();
              router.replace("/admin/login" as never);
            }}
          className="items-center justify-center rounded-full h-11 w-11 bg-white/10"
          >
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </Pressable>
        </View>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>


        {loading ? (
          <View className="items-center mt-20">
            <ActivityIndicator color="#22d3ee" size="large" />
            <Text className="mt-4 text-slate-300 font-display-medium">
              Loading admin metrics…
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap justify-between">
              {cards.map((card) => (
                <View
                  key={card.label}
                  className="mb-4 w-[48%] rounded-3xl border border-white/10 bg-slate-900 p-4"
                >
                  <View className="items-center justify-center w-12 h-12 mb-4 rounded-2xl bg-cyan-500/10">
                    <Ionicons name={card.icon} size={24} color="#22d3ee" />
                  </View>
                  <Text className="text-sm uppercase tracking-[0.2em] text-slate-400 font-display-semibold">
                    {card.label}
                  </Text>
                  <Text className="mt-2 text-2xl text-white font-display-bold">
                    {card.value}
                  </Text>
                </View>
              ))}
            </View>

              <View className="p-5 mt-2 border rounded-3xl border-white/10 bg-slate-900">
              <Text className="text-lg text-white font-display-bold">
                Management shortcuts
              </Text>

              <Pressable
                onPress={() => router.push("/admin/users" as never)}
                  className="flex-row items-center justify-between px-4 py-4 mt-4 rounded-2xl bg-slate-800"
                >
                  <View>
                    <Text className="text-lg text-white font-display-semibold">
                      User management
                    </Text>
                    <Text className="mt-1 text-slate-400 font-display">
                      Verify, review, or remove marketplace users.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#fff" />
                </Pressable>

                <Pressable
                  onPress={() => router.push("/admin/listings" as never)}
                  className="flex-row items-center justify-between px-4 py-4 mt-3 rounded-2xl bg-slate-800"
                >
                  <View>
                    <Text className="text-lg text-white font-display-semibold">
                      Listing moderation
                    </Text>
                    <Text className="mt-1 text-slate-400 font-display">
                      Review sellers’ listings and verify marketplace content.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#fff" />
                </Pressable>
              </View>

              <View className="p-5 mt-2 border rounded-3xl border-white/10 bg-slate-900">
                <Text className="text-lg text-white font-display-bold">
                  Recent activity
                </Text>
                <Text className="mt-1 text-slate-400 font-display">
                  View recent user signups, listings, and orders.
                </Text>

                <Pressable
                  onPress={() => router.push("/admin/orders" as never)}
                  className="flex-row items-center justify-between px-4 py-4 mt-4 rounded-2xl bg-slate-800"
                >
                  <View>
                    <Text className="text-lg text-white font-display-semibold">
                      Orders
                    </Text>
                    <Text className="mt-1 text-slate-400 font-display">
                      Recent orders
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#fff" />
                </Pressable>

                <Pressable
                  onPress={() => router.push("/admin/listings" as never)}
                  className="flex-row items-center justify-between px-4 py-4 mt-3 rounded-2xl bg-slate-800"
                >
                  <View>
                    <Text className="text-lg text-white font-display-semibold">
                      Listings
                    </Text>
                    <Text className="mt-1 text-slate-400 font-display">
                      View recently added listings
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#fff" />
                </Pressable>
              </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
