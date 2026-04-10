/**
 * EXAMPLE: How to integrate API calls into your screens
 * This example shows how to fetch listings for the Browse screen
 *
 * Copy this pattern and adapt it to other screens as needed
 */

import { getAllListings, Listing } from "@/lib/listingService";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FilterState {
  category: string;
  type: "SELLING" | "BUYING" | "LEASING";
  search: string;
  page: number;
  limit: number;
}

const BrowseScreenExample = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    type: "SELLING",
    search: "",
    page: 1,
    limit: 20,
  });

  /**
   * Fetch listings from backend
   */
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllListings(filters);

      if (response.success && response.data?.listings) {
        setListings(response.data.listings);
      } else {
        setError(response.error || "Failed to load listings");
        Alert.alert("Error", response.error || "Failed to load listings");
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Load listings on mount and when filters change
   */
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  /**
   * Handle category filter change
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCategoryFilter = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category,
      page: 1,
    }));
  };

  /**
   * Handle type filter change (SELLING, BUYING, LEASING)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTypeFilter = (type: "SELLING" | "BUYING" | "LEASING") => {
    setFilters((prev) => ({
      ...prev,
      type,
      page: 1,
    }));
  };

  /**
   * Handle pagination
   */
  const handleLoadMore = () => {
    setFilters((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  /**
   * Render empty state
   */
  if (listings.length === 0 && !loading && !error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-4">
            No Listings Found
          </Text>
          <Text className="text-lg text-gray-500 text-center">
            Try adjusting your filters or check back later
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Filters */}
      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-3xl font-bold text-gray-800 mb-4">
          Browse Listings
        </Text>

        {/* Category Filter - You can replace with a dropdown */}
        <Text className="text-sm font-semibold text-gray-500 mb-2">
          Type: {filters.type}
        </Text>
      </View>

      {/* Loading State */}
      {loading && listings.length === 0 && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6769ef" />
          <Text className="mt-4 text-gray-500">Loading listings...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-lg text-red-500 font-semibold text-center mb-4">
            {error}
          </Text>
          <Pressable
            onPress={fetchListings}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Listings List */}
      {!loading && listings.length > 0 && (
        <FlatList
          data={listings}
          renderItem={({ item }) => (
            <View className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
              <Text className="text-lg font-bold text-gray-800">
                {item.title}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                {item.category}
              </Text>
              <Text className="text-lg font-semibold text-primary mt-2">
                KES {item.price || "N/A"}
              </Text>
              <Text className="text-xs text-gray-400 mt-2">
                {item.location}
              </Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && listings.length > 0 ? (
              <ActivityIndicator color="#6769ef" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default BrowseScreenExample;

/**
 * ═══════════════════════════════════════════════════════════════
 * QUICK REFERENCE: Common patterns for API integration
 * ═══════════════════════════════════════════════════════════════
 */

// Pattern 1: Simple data fetch
/*
useEffect(() => {
    const fetch = async () => {
        const response = await someApiCall();
        if (response.success) {
            setData(response.data);
        }
    };
    fetch();
}, []);
*/

// Pattern 2: With loading state
/*
const [loading, setLoading] = useState(true);
useEffect(() => {
    const fetch = async () => {
        setLoading(true);
        const response = await someApiCall();
        if (response.success) setData(response.data);
        setLoading(false);
    };
    fetch();
}, []);
*/

// Pattern 3: Action with error handling
/*
const handleAction = async () => {
    try {
        const response = await someApiCall();
        if (response.success) {
            Alert.alert('Success', 'Action completed!');
        } else {
            Alert.alert('Error', response.error);
        }
    } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred');
    }
};
*/

// Pattern 4: With refetch capability
/*
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

const refetch = async () => {
    setLoading(true);
    const response = await someApiCall();
    if (response.success) setData(response.data);
    setLoading(false);
};

useEffect(() => {
    refetch();
}, []);

return (
    <FlatList
        data={data}
        {...props}
        refreshing={loading}
        onRefresh={refetch}
    />
);
*/
