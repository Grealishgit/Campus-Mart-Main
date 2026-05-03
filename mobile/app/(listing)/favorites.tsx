import React, { useState, useCallback } from 'react';
import {
    View, Text, Image, Pressable,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import {
    getFavorites, removeFavorite, Favorite,
} from '@/lib/favoriteService';

// ─── helpers ─────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString();

const FavoriteScreen = () => {
    const router = useRouter();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [removing, setRemoving] = useState<string | null>(null); // favoriteId being removed

    const fetchFavorites = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getFavorites();
            if (result.success && result.data?.favorites) {
                setFavorites(result.data.favorites);
            } else {
                setError(result.error || 'Failed to load favorites');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load favorites');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchFavorites(); }, [fetchFavorites]));

    const handleRemove = async (fav: Favorite) => {
        Alert.alert(
            'Remove Favorite',
            `Remove "${fav.title}" from favorites?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setRemoving(fav.favoriteId);
                            const result = await removeFavorite(fav.listingId, fav.type);
                            if (result.success) {
                                // Optimistic removal
                                setFavorites(prev => prev.filter(f => f.favoriteId !== fav.favoriteId));
                            } else {
                                Alert.alert('Error', result.error || 'Could not remove favorite.');
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Could not remove favorite.');
                        } finally {
                            setRemoving(null);
                        }
                    },
                },
            ]
        );
    };

    const handleCardPress = (fav: Favorite) => {
        router.push({
            pathname: '/product-item/[id]',
            params: {
                id: fav.listingId,
                title: fav.title,
                price: String(fav.price),
                priceUnit: fav.priceUnit ?? '',
                type: fav.type,
                category: fav.category,
                condition: fav.condition,
                location: fav.location,
                imageUrl: fav.imageUrl ?? '',
                description: fav.description,
                sellerName: fav.seller.name,
                sellerRole: fav.seller.role || fav.seller_role || 'student',
                sellerRating: String(fav.seller.rating),
                sellerAvatar: fav.seller.avatarUrl ?? '',
                sellerVerified: String(fav.seller.isVerified),
            },
        });
    };

    return (
      <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Pressable
                  onPress={() => router.back()}
                  className="items-center justify-center w-10 h-10 rounded-full active:bg-gray-50"
              >
                  <Ionicons name="chevron-back" size={22} color="#111827" />
              </Pressable>
              <Text className="text-xl text-gray-900 font-display-bold">Favorites</Text>
              <View className="flex-row items-center gap-1 px-3 py-1.5 bg-rose-50 rounded-full">
                  <Ionicons name="heart" size={14} color="#f43f5e" />
                  <Text className="text-sm text-rose-500 font-display-semibold">{favorites.length}</Text>
              </View>
          </View>

          {loading ? (
              <View className="items-center justify-center flex-1">
                  <ActivityIndicator size="large" color="#6769ef" />
                  <Text className="mt-3 text-sm text-gray-400 font-display">Loading favorites…</Text>
              </View>
          ) : error ? (
              <View className="items-center justify-center flex-1 px-6">
                  <Ionicons name="alert-circle-outline" size={44} color="#ef4444" />
                  <Text className="mt-3 text-base text-center text-gray-700 font-display-semibold">{error}</Text>
                  <Pressable onPress={fetchFavorites} className="px-6 py-3 mt-4 bg-primary rounded-xl">
                      <Text className="text-white font-display-semibold">Retry</Text>
                  </Pressable>
              </View>
          ) : favorites.length === 0 ? (
              <View className="items-center justify-center flex-1 px-6">
                  <Ionicons name="heart-outline" size={52} color="#d1d5db" />
                  <Text className="mt-4 text-xl text-gray-600 font-display-bold">No favorites yet</Text>
                  <Text className="mt-1 text-sm text-center text-gray-400 font-display">
                      Tap the heart icon on any listing to save it here.
                  </Text>
                  <Pressable
                      onPress={() => router.push('/(tabs)/browse' as never)}
                      className="px-6 py-3 mt-5 bg-primary rounded-xl"
                  >
                      <Text className="text-white font-display-semibold">Browse Listings</Text>
                  </Pressable>
              </View>
          ) : (
              <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ padding: 16, gap: 12 }}
              >
                  {favorites.map(fav => (
                      <Pressable
                          key={fav.favoriteId}
                          onPress={() => handleCardPress(fav)}
                          className="flex-row gap-3 p-3 bg-white border border-gray-100 rounded-2xl active:opacity-80"
                          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                      >
                          {/* Image */}
                          <View className="overflow-hidden bg-gray-100 rounded-xl" style={{ width: 88, height: 88 }}>
                              <Image
                                  source={{ uri: fav.imageUrl || 'https://via.placeholder.com/88' }}
                                  className="w-full h-full"
                                  resizeMode="cover"
                              />
                              {/* Type badge */}
                              <View
                                  className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full"
                                  style={{ backgroundColor: fav.type === 'LEASE' ? '#6769ef' : '#10b981' }}
                              >
                                  <Text className="text-[9px] text-white font-display-bold uppercase tracking-wider">
                                      {fav.type}
                                  </Text>
                              </View>
                          </View>

                          {/* Info */}
                          <View className="flex-1 justify-between py-0.5">
                              <View className="flex-row items-start justify-between gap-2">
                                  <Text className="flex-1 text-base leading-tight text-gray-900 font-display-bold" numberOfLines={2}>
                                      {fav.title}
                                  </Text>

                                  {/* Heart / remove button */}
                                  <Pressable
                                      onPress={(e) => { e.stopPropagation(); handleRemove(fav); }}
                                      hitSlop={8}
                                      className="items-center justify-center w-8 h-8 rounded-full bg-rose-50"
                                  >
                                      {removing === fav.favoriteId
                                          ? <ActivityIndicator size="small" color="#f43f5e" />
                                          : <Ionicons name="heart" size={18} color="#f43f5e" />
                                      }
                                  </Pressable>
                              </View>

                              {/* Price */}
                              <View className="flex-row items-baseline gap-0.5">
                                  <Text className="text-xs text-gray-400 font-display">Ksh</Text>
                                  <Text className="text-base text-primary font-display-bold">{fmt(fav.price)}</Text>
                                  {fav.type === 'LEASE' && fav.priceUnit && (
                                      <Text className="text-xs text-gray-400 font-display">{fav.priceUnit}</Text>
                                  )}
                              </View>

                              {/* Meta pills */}
                              <View className="flex-row flex-wrap gap-1">
                                  {[
                                      { icon: 'location-outline', value: fav.location },
                                      { icon: 'grid-outline', value: fav.category },
                                      { icon: 'sparkles-outline', value: fav.condition },
                                  ].filter(m => m.value).map(m => (
                                      <View key={m.icon} className="flex-row items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                                          <Ionicons name={m.icon as any} size={9} color="#9ca3af" />
                                          <Text className="text-[10px] text-gray-500 font-display-medium" numberOfLines={1}>
                                              {m.value}
                                          </Text>
                                      </View>
                                  ))}
                              </View>

                              {/* Seller */}
                              <View className="flex-row items-center gap-1">
                                  <Ionicons name="storefront-outline" size={11} color="#9ca3af" />
                                  <Text className="text-xs text-gray-400 font-display" numberOfLines={1}>
                                      {fav.seller.name}
                                  </Text>
                                  {fav.seller.isVerified && (
                                      <MaterialIcons name="verified" size={11} color="#3b82f6" />
                                  )}
                              </View>
                          </View>
              </Pressable>
          ))}
              </ScrollView>
          )}
      </SafeAreaView>
    );
};

export default FavoriteScreen;