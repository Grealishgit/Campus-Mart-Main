import { View, Text, TextInput, ScrollView, FlatList, useWindowDimensions } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Listing, TransactionType } from '@/types';
import { dummyListing } from '@/lib/dummydata';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import '../../global.css'
import ListingCard from '@/components/ListingCard';

const HomeScreen = () => {

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sale' | 'lease'>('sale');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32 - 12) / 2; // 32 = px-4 on both sides, 12 = gap between cards

  const categories = ['All', 'Textbooks', 'Tech', 'Dorm Decor', 'Bikes', 'Leisure'];

  const filteredListings = dummyListing.filter(l => {
    const matchesTab = activeTab === 'sale' ? l.type === TransactionType.SALE : l.type === TransactionType.LEASE;
    const matchesCategory = selectedCategory === 'All' || l.category === selectedCategory;
    return matchesTab && matchesCategory;
  });


  const handleOnClick = (item: Listing) => {
    router.push({
      pathname: '/product-item/[id]',
      params: {
        id: item.id,
        title: item.title,
        price: item.price,
        priceUnit: item.priceUnit ?? '',
        type: item.type,
        category: item.category,
        condition: item.condition,
        location: item.location,
        distance: item.distance,
        imageUrl: item.imageUrl,
        isVerified: String(item.isVerified),
        description: item.description,
        sellerName: item.seller.name,
        sellerRating: item.seller.rating,
        sellerAvatar: item.seller.avatarUrl,
        sellerVerified: String(item.seller.isVerified),
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
            <Pressable className="p-2">
              <Ionicons name='sparkles-sharp' color='#6769ef' size={24} />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center px-4 bg-gray-100 rounded-xl h-11">
          <Ionicons name='search' color='#9CA3AF' size={24} />
          <TextInput
            className="flex-1 ml-2 text-md font-display"
            placeholder="Search textbooks, tech, or bikes..."
            placeholderTextColor="#9CA3AF"
            editable={false}
          />
        </View>
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
                {categories.map(cat => (
                  <Pressable
                    key={cat}
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
                onPress={() => setActiveTab('sale')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: activeTab === 'sale' ? '#fff' : 'transparent',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: 'Jost-Bold',
                    color: activeTab === 'sale' ? '#6769ef' : '#6b7280',
                  }}
                >
                  Buy Now
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('lease')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: activeTab === 'lease' ? '#fff' : 'transparent',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontFamily: 'Jost-Bold',
                    color: activeTab === 'lease' ? '#6769ef' : '#6b7280',
                  }}
                >
                  Rent/Lease
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Listings Grid */}
          <View className="px-4">
            {filteredListings.length > 0 ? (
              <FlatList
                key={`${activeTab}-${selectedCategory}`}
                data={filteredListings}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                renderItem={({ item }) => (
                  <ListingCard
                    listing={item}
                    onClick={() => handleOnClick(item)}
                    cardWidth={cardWidth}
                  />
                )}
              />
            ) : (
              <View className="items-center w-full py-20">
                <Text className="text-center text-gray-400">
                  No items found in this category.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* FAB */}
      <Pressable
        className="absolute items-center justify-center rounded-full shadow-lg bottom-6 right-6 w-14 h-14 bg-primary active:opacity-80"
      >
        <Text className="text-3xl text-white">+</Text>
      </Pressable>
    </SafeAreaView>
  )
}

export default HomeScreen