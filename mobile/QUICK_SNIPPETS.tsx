/**
 * QUICK COPY-PASTE SNIPPETS FOR API INTEGRATION
 *
 * ⚠️ NOTE: This file contains CODE EXAMPLES/SNIPPETS
 * These are NOT meant to be imported or used directly.
 * Copy the snippets you need into your actual screen components.
 *
 * USAGE:
 * 1. Find the snippet you want
 * 2. Copy the code block
 * 3. Paste into your screen component
 * 4. Adapt as needed for your use case
 */

// @ts-nocheck

/**
// 1. SIMPLE DATA FETCH (Browse/Listings Screen)
// ================================================================

import { getAllListings, Listing } from "@/lib/listingService";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text } from "react-native";

const MyScreen = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await getAllListings({ limit: 20 });
      if (res.success) setListings(res.data?.listings || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <FlatList
      data={listings}
      renderItem={({ item }) => <Text>{item.title}</Text>}
      keyExtractor={(item) => item.id}
    />
  );
};

// ================================================================
// 2. ACTION WITH ERROR HANDLING (Create/Update)
// ================================================================

import { createListing } from "@/lib/listingService";
import { Alert } from "react-native";

const handleCreate = async (formData) => {
  try {
    const response = await createListing(formData);
    if (response.success) {
      Alert.alert("Success", "Created!");
      router.back();
    } else {
      Alert.alert("Error", response.error);
    }
  } catch (error) {
    Alert.alert("Error", "Unexpected error occurred");
  }
};

// ================================================================
// 3. FAVORITE TOGGLE (Product Details)
// ================================================================

import { addFavorite, removeFavorite } from "@/lib/favoriteService";

const [isFavorite, setIsFavorite] = useState(false);

const toggleFavorite = async () => {
  const res = isFavorite
    ? await removeFavorite(listingId)
    : await addFavorite(listingId);

  if (res.success) {
    setIsFavorite(!isFavorite);
  }
};

// ================================================================
// 4. LOAD MORE / PAGINATION
// ================================================================

const [page, setPage] = useState(1);
const [listings, setListings] = useState<Listing[]>([]);
const [loading, setLoading] = useState(false);

const loadMore = async () => {
  setLoading(true);
  const res = await getAllListings({ page, limit: 20 });
  if (res.success && res.data?.listings) {
    setListings((prev) => [...prev, ...res.data.listings]);
    setPage((prev) => prev + 1);
  }
  setLoading(false);
};

// In FlatList:
// onEndReached={loadMore}
// onEndReachedThreshold={0.5}
// ListFooterComponent={loading ? <ActivityIndicator /> : null}

// ================================================================
// 5. SEND MESSAGE (Chat Screen)
// ================================================================

import { sendMessage } from "@/lib/chatService";

const [messages, setMessages] = useState([]);
const [text, setText] = useState("");

const handleSend = async () => {
  if (!text.trim()) return;

  const res = await sendMessage(conversationId, text);
  if (res.success && res.data) {
    setMessages((prev) => [...prev, res.data]);
    setText("");
  }
};

// ================================================================
// 6. GET USER PROFILE (Profile Screen)
// ================================================================

import { getCurrentUser } from "@/lib/authService";

const [user, setUser] = useState(null);

useEffect(() => {
  const fetch = async () => {
    const res = await getCurrentUser();
    if (res.success) setUser(res.data);
  };
  fetch();
}, []);

// ================================================================
// 7. LOGOUT (Settings)
// ================================================================

import { logoutUser } from "@/lib/authService";

const handleLogout = async () => {
  await logoutUser();
  router.replace("/(auth)");
};

// ================================================================
// 8. CHECK AUTHENTICATION STATUS
// ================================================================

import { isAuthenticated } from "@/lib/authService";

useEffect(() => {
  const checkAuth = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      router.replace("/(auth)");
    }
  };
  checkAuth();
}, []);

// ================================================================
// 9. FILTER LISTINGS BY CATEGORY
// ================================================================

const [category, setCategory] = useState("");

const fetchByCategory = async (cat: string) => {
  setCategory(cat);
  const res = await getAllListings({ category: cat });
  if (res.success) {
    setListings(res.data?.listings || []);
  }
};

// ================================================================
// 10. SEARCH LISTINGS
// ================================================================

const [searchText, setSearchText] = useState("");

const handleSearch = async () => {
  const res = await getAllListings({ search: searchText });
  if (res.success) {
    setListings(res.data?.listings || []);
  }
};

// <TextInput
//     value={searchText}
//     onChangeText={setSearchText}
//     placeholder="Search..."
//     onSubmitEditing={handleSearch}
// />

// ================================================================
// 11. PULL TO REFRESH
// ================================================================

const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  const res = await getAllListings();
  if (res.success) setListings(res.data?.listings || []);
  setRefreshing(false);
};

// <FlatList
//     refreshing={refreshing}
//     onRefresh={onRefresh}
//     {...other props}
// />

// ================================================================
// 12. ORDERS/LEASES SCREEN
// ================================================================

import { getOrders, updateOrderStatus } from "@/lib/orderService";

const [orders, setOrders] = useState([]);

useEffect(() => {
  const fetch = async () => {
    const res = await getOrders("PENDING");
    if (res.success) setOrders(res.data?.orders || []);
  };
  fetch();
}, []);

const handleAcceptOrder = async (orderId: string) => {
  const res = await updateOrderStatus(orderId, "ACCEPTED");
  if (res.success) {
    // Update state
  }
};

// ================================================================
// COMMON PATTERNS REFERENCE
// ================================================================

/*
✅ Always check response.success before using response.data
✅ Use .error for error messages (response.error)
✅ Use Alert.alert() for user feedback
✅ Use setLoading() for loading states
✅ Include try-catch for unexpected errors
✅ Use router for navigation on success
✅ Extract API calls from UI components when possible

❌ Don't assume success without checking response.success
❌ Don't ignore error states
❌ Don't block UI during API calls (always use loading states)
❌ Don't forget to handle token refresh if needed
*/
