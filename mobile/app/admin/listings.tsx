import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  getAdminListings,
  verifyAdminListing,
  type AdminListing,
} from "@/lib/adminService";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminListingsScreen() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<AdminListing[]>([]);

  const loadListings = async () => {
    setLoading(true);
    const response = await getAdminListings();

    if (response.success && response.data?.listings) {
      setListings(response.data.listings);
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, []),
  );

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
            Listing Moderation
          </Text>
          <Text className="text-slate-400 font-display">
            Review and verify vendor listings.
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <View className="items-center mt-20">
            <ActivityIndicator color="#22d3ee" size="large" />
          </View>
        ) : (
          listings.map((listing) => (
            <View
              key={`${listing.type || "LISTING"}-${listing.id}`}
              className="p-4 mb-4 border rounded-3xl border-white/10 bg-slate-900"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-xl text-white font-display-bold">
                    {listing.title}
                  </Text>
                  <Text className="mt-1 text-slate-300 font-display">
                    {listing.seller_name || "Unknown seller"} ·{" "}
                    {listing.seller_email || "No email"}
                  </Text>
                </View>
                <View className="px-3 py-2 rounded-full bg-white/5">
                  <Text className="text-xs uppercase tracking-[0.2em] text-cyan-300 font-display-semibold">
                    {listing.type || "listing"}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap mt-3">
                <Text className="mr-3 text-slate-400 font-display">
                  {listing.category || "Uncategorized"}
                </Text>
                <Text className="text-slate-400 font-display">
                  {listing.price ? `KES ${Number(listing.price).toLocaleString()}` : "No price"}
                </Text>
              </View>

              <Text className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500 font-display-semibold">
                {listing.is_verified ? "verified" : "awaiting review"} ·{" "}
                {listing.is_available ? "available" : "unavailable"}
              </Text>

              {!listing.is_verified && (
                <Pressable
                  onPress={async () => {
                    const response = await verifyAdminListing(
                      String(listing.id),
                      listing.type,
                    );
                    if (!response.success) {
                      Alert.alert(
                        "Verification failed",
                        response.error || "Please try again.",
                      );
                      return;
                    }
                    loadListings();
                  }}
                  className="items-center py-3 mt-4 rounded-2xl bg-cyan-500"
                >
                  <Text className="text-slate-950 font-display-bold">
                    Verify listing
                  </Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
