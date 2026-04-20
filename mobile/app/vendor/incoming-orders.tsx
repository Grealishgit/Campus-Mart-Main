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
  View,
} from "react-native";

import { getSellingOrders, updateOrderStatus, type Order } from "@/lib/orderService";

export default function VendorIncomingOrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = async () => {
    setLoading(true);
    const response = await getSellingOrders();

    if (response.success && response.data?.orders) {
      setOrders(response.data.orders);
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, []),
  );

  const handleStatusUpdate = async (
    orderId: string,
    status: "confirmed" | "completed" | "cancelled",
  ) => {
    const response = await updateOrderStatus(orderId, status);

    if (!response.success) {
      Alert.alert("Update failed", response.error || "Please try again.");
      return;
    }

    loadOrders();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </Pressable>
        <View>
          <Text className="text-2xl text-slate-900 font-display-bold">
            Incoming Orders
          </Text>
          <Text className="text-slate-500 font-display">
            Accept, complete, or cancel vendor orders.
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <View className="mt-20 items-center">
            <ActivityIndicator color="#6769ef" size="large" />
          </View>
        ) : orders.length === 0 ? (
          <View className="mt-20 rounded-3xl border border-dashed border-slate-300 p-8">
            <Text className="text-center text-lg text-slate-700 font-display-bold">
              No incoming orders yet
            </Text>
            <Text className="mt-2 text-center text-slate-500 font-display">
              New buyer requests will appear here as your listings start getting attention.
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View
              key={order.id}
              className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-xl text-slate-900 font-display-bold">
                    {order.listing?.title || "Listing"}
                  </Text>
                  <Text className="mt-1 text-slate-500 font-display">
                    Buyer order #{order.id}
                  </Text>
                </View>
                <View className="rounded-full bg-white px-3 py-2">
                  <Text className="text-xs uppercase tracking-[0.2em] text-primary font-display-semibold">
                    {order.status}
                  </Text>
                </View>
              </View>

              <Text className="mt-3 text-slate-600 font-display">
                Amount: {order.totalPrice ? `KES ${order.totalPrice}` : "Pending price"}
              </Text>

              <View className="mt-4 flex-row gap-3">
                {order.status === "pending" && (
                  <Pressable
                    onPress={() => handleStatusUpdate(order.id, "confirmed")}
                    className="flex-1 items-center rounded-2xl bg-primary py-3"
                  >
                    <Text className="text-white font-display-bold">Accept</Text>
                  </Pressable>
                )}

                {(order.status === "pending" || order.status === "confirmed") && (
                  <Pressable
                    onPress={() =>
                      handleStatusUpdate(
                        order.id,
                        order.status === "pending" ? "cancelled" : "completed",
                      )
                    }
                    className="flex-1 items-center rounded-2xl border border-slate-300 bg-white py-3"
                  >
                    <Text className="text-slate-900 font-display-bold">
                      {order.status === "pending" ? "Decline" : "Complete"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
