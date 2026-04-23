import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAdminListings,
  verifyAdminListing,
  type AdminListing,
} from "@/lib/adminService";

type ListingFilter = "all" | "lease" | "sale" | "unverified";

function getListingType(listing: AdminListing) {
  return (listing.type || "").toLowerCase().trim();
}

export default function AdminListingsScreen() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [activeFilter, setActiveFilter] = useState<ListingFilter>("all");

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

  const totalListings = listings.length;
  const totalLeaseListings = useMemo(
    () => listings.filter((listing) => getListingType(listing) === "lease").length,
    [listings],
  );
  const totalSaleListings = useMemo(
    () => listings.filter((listing) => getListingType(listing) === "sale").length,
    [listings],
  );
  const unverifiedListings = useMemo(
    () => listings.filter((listing) => !listing.is_verified).length,
    [listings],
  );

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const type = getListingType(listing);

      if (activeFilter === "lease") {
        return type === "lease";
      }

      if (activeFilter === "sale") {
        return type === "sale";
      }

      if (activeFilter === "unverified") {
        return !listing.is_verified;
      }

      return true;
    });
  }, [activeFilter, listings]);

  const filterCards = [
    {
      key: "all" as const,
      label: "Total listings",
      value: totalListings,
      icon: "albums-outline" as const,
    },
    {
      key: "lease" as const,
      label: "Lease listings",
      value: totalLeaseListings,
      icon: "home-outline" as const,
    },
    {
      key: "sale" as const,
      label: "Sale listings",
      value: totalSaleListings,
      icon: "pricetag-outline" as const,
    },
    {
      key: "unverified" as const,
      label: "Unverified",
      value: unverifiedListings,
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
            Listing Moderation
          </Text>
          <Text className="text-slate-400 font-display">
            Review and verify vendor listings.
          </Text>
        </View>
      </View>

      <View className="px-5 pb-4">
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {filterCards.map((card) => {
            const isActive = activeFilter === card.key;

            return (
              <Pressable
                key={card.key}
                onPress={() => setActiveFilter(card.key)}
                className={`w-[48%] rounded-3xl border p-4 ${isActive
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

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {loading ? (
          <View className="items-center mt-20">
            <ActivityIndicator color="#22d3ee" size="large" />
          </View>
        ) : filteredListings.length === 0 ? (
          <View className="items-center justify-center mt-20">
            <Text className="text-lg text-white font-display-semibold">
              No listings found
            </Text>
            <Text className="mt-2 text-center text-slate-400 font-display">
              Try a different filter or verify more listings.
            </Text>
          </View>
        ) : (
              filteredListings.map((listing) => (
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
                  {listing.price
                    ? `KES ${Number(listing.price).toLocaleString()}`
                    : "No price"}
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
