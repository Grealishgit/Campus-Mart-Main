import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import { getMyListings } from "@/lib/listingService";
import { getSellingOrders } from "@/lib/orderService";

export default function VendorDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeListings: 0,
    verifiedListings: 0,
    incomingOrders: 0,
    completedOrders: 0,
  });

  const loadDashboard = async () => {
    setLoading(true);

    const [listingsResponse, ordersResponse] = await Promise.all([
      getMyListings(),
      getSellingOrders(),
    ]);

    const listings = listingsResponse.data?.listings || [];
    const orders = ordersResponse.data?.orders || [];

    setStats({
      activeListings: listings.filter((item: any) => item.isAvailable !== false).length,
      verifiedListings: listings.filter((item: any) => item.isVerified).length,
      incomingOrders: orders.filter((order: any) => order.status === "pending").length,
      completedOrders: orders.filter((order: any) => order.status === "completed").length,
    });

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  const cards = [
    { label: "Active Listings", value: stats.activeListings, icon: "cube-outline" as const },
    { label: "Verified", value: stats.verifiedListings, icon: "shield-checkmark-outline" as const },
    { label: "Incoming Orders", value: stats.incomingOrders, icon: "mail-unread-outline" as const },
    { label: "Completed", value: stats.completedOrders, icon: "checkmark-done-outline" as const },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mb-8 mt-5 flex-row items-center justify-between">
          <View>
            <Text className="text-sm uppercase tracking-[0.25em] text-primary font-display-bold">
              Vendor Hub
            </Text>
            <Text className="mt-2 text-3xl text-slate-900 font-display-bold">
              Dashboard
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </Pressable>
        </View>

        {loading ? (
          <View className="mt-20 items-center">
            <ActivityIndicator color="#6769ef" size="large" />
            <Text className="mt-4 text-slate-500 font-display-medium">
              Loading vendor insights…
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap justify-between">
              {cards.map((card) => (
                <View
                  key={card.label}
                  className="mb-4 w-[48%] rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Ionicons name={card.icon} size={24} color="#6769ef" />
                  </View>
                  <Text className="text-sm uppercase tracking-[0.2em] text-slate-500 font-display-semibold">
                    {card.label}
                  </Text>
                  <Text className="mt-2 text-2xl text-slate-900 font-display-bold">
                    {card.value}
                  </Text>
                </View>
              ))}
            </View>

            <View className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <Text className="text-lg text-slate-900 font-display-bold">
                Quick actions
              </Text>

              <Pressable
                onPress={() => router.push("/vendor/incoming-orders" as never)}
                className="mt-4 flex-row items-center justify-between rounded-2xl bg-white px-4 py-4"
              >
                <View>
                  <Text className="text-lg text-slate-900 font-display-semibold">
                    Incoming orders
                  </Text>
                  <Text className="mt-1 text-slate-500 font-display">
                    Review new requests from students and buyers.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#0f172a" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/(listing)/create-listing")}
                className="mt-3 flex-row items-center justify-between rounded-2xl bg-white px-4 py-4"
              >
                <View>
                  <Text className="text-lg text-slate-900 font-display-semibold">
                    Create listing
                  </Text>
                  <Text className="mt-1 text-slate-500 font-display">
                    Add a new item for sale or lease.
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color="#0f172a" />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
