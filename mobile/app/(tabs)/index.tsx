import { View, Text, TextInput, ScrollView, FlatList, useWindowDimensions, ActivityIndicator, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAllListings, getCategories } from '@/lib/listingService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';


import '../../global.css'
import ListingCard from '@/components/ListingCard';
import { getFavorites } from '@/lib/favoriteService';

const HomeScreen = () => {

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SALE' | 'LEASE'>('SALE');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32 - 12) / 2;
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const catResponse = await getCategories();
      if (catResponse.success && catResponse.data?.categories) {
        // Extract string value from object if needed, then remove duplicates
        const rawCategories = catResponse.data.categories.map((c: any) =>
          typeof c === 'object' && c !== null ? c.category : c
        );
        const uniqueCategories: string[] = ['All', ...new Set<string>(rawCategories)];
        setCategories(uniqueCategories);
      }

      // Fetch listings with filters
      const filters: any = {
        type: activeTab,
        page: 1,
        limit: 20,
      };

      if (selectedCategory !== 'All') {
        filters.category = selectedCategory;
      }

      const response = await getAllListings(filters);
      if (response.success && response.data?.listings) {
        setListings(response.data.listings);
      } else {
        setError(response.error || 'Failed to load listings');
      }
    } catch (err) {
      setError('An error occurred while loading listings');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory]);

  // Fetch listings and categories on component mount
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      const loadFavs = async () => {
        const result = await getFavorites();
        if (result.success && result.data?.favorites) {
          const ids = new Set(result.data.favorites.map((f: any) => f.listingId));
          setFavoritedIds(ids);
        }
      };
      loadFavs();
    }, [loadData])
  );

  // useEffect(() => {
  //   const loadFavs = async () => {
  //     const result = await getFavorites();
  //     if (result.success && result.data?.favorites) {
  //       const ids = new Set(result.data.favorites.map(f => f.listingId));
  //       setFavoritedIds(ids);
  //     }
  //   };
  //   loadFavs();
  // }, []);

  const filteredListings = listings;

  const handleOnClick = (item: any) => {
    router.push({
      pathname: '/product-item/[id]',
      params: {
        id: item.id,
        title: item.title,
        price: item.price,
        priceUnit: item.priceUnit || item.price_unit || '',
        type: item.type,
        category: item.category,
        condition: item.condition,
        location: item.location,
        distance: item.distance || '0 km',
        imageUrl: item.imageUrl || item.image_url || '',
        isVerified: String(item.isVerified || item.is_verified || false),
        description: item.description,
        sellerId: item.seller?.id ?? item.userId ?? '',
        sellerName: item.seller?.name || item.seller_name || 'Unknown',
        sellerRole: item.seller?.role || item.seller_role || item.sellerRole || 'student',
        sellerRating: item.seller?.rating || item.seller_rating || 0,
        sellerAvatar: item.seller?.avatarUrl || item.seller_avatar || '',
        sellerVerified: String(item.seller?.isVerified || item.seller_verified || false),
      }
    } as any);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-2 pb-2 border-b border-gray-100">
        {/* Top Row */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <View className="p-2 rounded-2xl bg-primary">
              <Ionicons name='school' color='#ffffff' size={24} />
            </View>
            <Text className="text-3xl text-primary font-display-bold">CampusMart</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="relative p-2">
              <Ionicons name='notifications' color='#313941' size={24} />
              <View className="absolute w-2 h-2 rounded-full bg-primary top-2 right-2" />
            </Pressable>
            <Pressable onPress={() => router.navigate('/ai-chat/aichat')} className="p-2">
              <Ionicons name='sparkles-sharp' color='#6769ef' size={24} />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <Pressable onPress={() => router.navigate('/browse')}
          className="flex-row items-center px-4 bg-gray-100 rounded-xl h-11">
          <Ionicons name='search' color='#9CA3AF' size={24} />
          <TextInput
            className="flex-1 ml-2 text-md font-display"
            placeholder="Search textbooks, tech, or bikes..."
            placeholderTextColor="#9CA3AF"
            editable={false}
          />
        </Pressable>
      </View>

      {/* Main Content */}
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Categories */}
          <View className="px-4 mt-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="py-2"
            >
              <View className="flex-row gap-2">
                {categories.map((cat, index) => (
                  <Pressable
                    key={`${cat}-${index}`}
                    onPress={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full ${selectedCategory === cat
                      ? 'bg-primary'
                      : 'bg-gray-100'
                      }`}
                  >
                    <Text className={`text-sm font-display-medium ${selectedCategory === cat
                      ? 'text-white'
                      : 'text-gray-600'
                      }`}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Tab Selector */}
          <View className="px-4 py-4">
            <View className="flex-row p-1 bg-gray-100 rounded-xl">
              <Pressable
                onPress={() => setActiveTab('SALE')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: activeTab === 'SALE' ? '#fff' : 'transparent',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: 'Jost-Bold',
                    color: activeTab === 'SALE' ? '#6769ef' : '#6b7280',
                  }}
                >
                  Buy Now
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('LEASE')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: activeTab === 'LEASE' ? '#fff' : 'transparent',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: 'Jost-Bold',
                    color: activeTab === 'LEASE' ? '#6769ef' : '#6b7280',
                  }}
                >
                  Rent/Lease
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Loading State */}
          {loading && (
            <View className="items-center justify-center flex-1 py-20">
              <ActivityIndicator size="large" color="#6769ef" />
              <Text className="mt-4 text-gray-600">Loading listings...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View className="p-4 mx-4 rounded-lg bg-red-50">
              <Text className="text-red-600 font-display-medium">Error</Text>
              <Text className="mt-1 text-red-500">{error}</Text>
              <Pressable
                onPress={loadData}
                className="px-4 py-2 mt-3 bg-red-600 rounded-lg"
              >
                <Text className="text-center text-white font-display-medium">Retry</Text>
              </Pressable>
            </View>
          )}

          {/* Listings Grid */}
          <View className="px-4">
            {!loading && !error && filteredListings.length > 0 && (
              <FlatList
                key={`${activeTab}-${selectedCategory}`}
                data={filteredListings}
                keyExtractor={(item) => {
                  return item.id?.toString() || `${item.title}-${Math.random()}`;
                }}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                renderItem={({ item }) => (
                  <ListingCard
                    listing={item}
                    isFavorited={favoritedIds.has(item?.id)}
                    onClick={() => handleOnClick(item)}
                    cardWidth={cardWidth}
                  />
                )}
              />
            )}
            
            {/* Empty State */}
            {!loading && !error && filteredListings.length === 0 && (
              <View className="items-center justify-center py-20">
                <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
                <Text className="mt-4 text-lg text-gray-500 font-display-medium">
                  No listings found
                </Text>
                <Text className="mt-2 text-sm text-center text-gray-400">
                  Try changing your filters or check back later
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* FAB */}
      <Pressable
        className="absolute items-center justify-center rounded-full shadow-lg bottom-6 right-6 w-14 h-14 bg-primary active:opacity-80"
        onPress={() => router.push('/create-listing')}
      >
        <Text className="text-3xl text-white">+</Text>
      </Pressable>
    </SafeAreaView>
  )
}

export default HomeScreen
