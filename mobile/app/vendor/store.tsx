import { Image, Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { getAllListings, getVendorStore, Listing, VendorStoreResponse } from '@/lib/listingService'

const VendorStore = () => {
    const router = useRouter();
    const {
        sellerId,
        sellerName,
        sellerAvatar,
        sellerRating,
        sellerVerified,
        sellerLocation,
    } = useLocalSearchParams<{
        sellerId: string;
        sellerName?: string;
        sellerAvatar?: string;
        sellerRating?: string;
        sellerVerified?: string;
        sellerLocation?: string;
    }>();

    const [loading, setLoading] = useState(true);
    const [storeData, setStoreData] = useState<VendorStoreResponse | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadStore = async () => {
            if (!sellerId) {
                setError('Missing seller id');
                setLoading(false);
                return;
            }

            try {
                const result = await getVendorStore(String(sellerId));
                const storePayload = (result.data as any)?.store ?? result.data;
                if (result.success && storePayload?.seller) {
                    setStoreData(storePayload);
                } else {
                    // Fallback for backends that haven't deployed /listings/store/:sellerId yet.
                    const all = await getAllListings({ page: 1, limit: 200 });
                    if (!all.success) {
                        setError(result.error || all.error || 'Failed to load store');
                        return;
                    }

                    const rawListings = all.data?.listings || all.data?.data || [];
                    const sellerListings = rawListings.filter((item: any) => {
                        const itemSellerId = String(item?.seller?.id ?? item?.userId ?? item?.seller_id ?? '');
                        return itemSellerId === String(sellerId);
                    });

                    setStoreData({
                        seller: {
                            id: String(sellerId),
                            name: String(sellerName || 'Vendor'),
                            role: 'vendor',
                            avatar_url: String(sellerAvatar || ''),
                            is_verified: String(sellerVerified || 'false') === 'true',
                            location: String(sellerLocation || ''),
                            rating: Number(sellerRating || 0),
                            total_sales: 0,
                            active_listings: sellerListings.length,
                        },
                        listings: sellerListings,
                        stats: {
                            totalListings: sellerListings.length,
                            averageRating: Number(sellerRating || 0),
                            totalSales: 0,
                        },
                    });
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load store');
            } finally {
                setLoading(false);
            }
        };

        loadStore();
    }, [sellerId]);

    const openListing = (item: Listing) => {
        router.push({
            pathname: '/product-item/[id]',
            params: {
                id: item.id,
                title: item.title,
                description: item.description,
                price: String(item.price),
                priceUnit: item.priceUnit ?? '',
                type: item.type,
                category: item.category,
                condition: item.condition ?? '',
                location: item.location,
                imageUrl: item.imageUrl ?? '',
                sellerName: storeData?.seller.name ?? '',
                sellerRole: storeData?.seller.role ?? 'vendor',
                sellerRating: String(storeData?.seller.rating ?? 0),
                sellerAvatar: storeData?.seller.avatar_url ?? '',
                sellerVerified: String(storeData?.seller.is_verified ?? false),
                sellerId: storeData?.seller.id ?? '',
                minDuration: String(item.minDuration ?? ''),
                maxDuration: String(item.maxDuration ?? ''),
                durationUnit: item.durationUnit ?? '',
                availableFrom: item.availableFrom ?? '',
                availableUntil: item.availableUntil ?? '',
            },
        });
    };

    if (loading) {
        return (
            <SafeAreaView className="items-center justify-center flex-1 bg-white">
                <ActivityIndicator size="large" color="#6769ef" />
                <Text className="mt-3 text-gray-500 font-display">Loading store...</Text>
            </SafeAreaView>
        );
    }

    if (error || !storeData) {
        return (
            <SafeAreaView className="items-center justify-center flex-1 px-6 bg-white">
                <Text className="text-lg text-center text-gray-800 font-display-semibold">Store unavailable</Text>
                <Text className="mt-2 text-center text-gray-500 font-display">{error || 'Could not load store information.'}</Text>
                <Pressable
                    onPress={() => router.back()}
                    className="px-5 py-3 mt-5 rounded-xl bg-primary"
                >
                    <Text className="text-white font-display-semibold">Go Back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const seller = storeData.seller;
    const sellerAvatarUrl = seller.avatar_url ?? sellerAvatar ?? '';
    const sellerLocationValue = seller.location ?? sellerLocation ?? '';
    const sellerNameValue = seller.name ?? sellerName ?? 'Vendor';
    const sellerRatingValue = Number(seller.rating ?? sellerRating ?? 0);
    const sellerVerifiedValue = Boolean(seller.is_verified ?? (String(sellerVerified || 'false') === 'true'));

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                <Pressable onPress={() => router.back()} className="items-center justify-center w-10 h-10 rounded-full bg-gray-50">
                    <Ionicons name="chevron-back" size={22} color="#6769ef" />
                </Pressable>
                <Text className="flex-1 text-xl text-center text-gray-900 font-display-bold">Vendor Store</Text>
                <View className="w-10" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View className="px-4 pt-4">
                    <View className="flex-row items-center gap-3 p-4 border border-gray-100 bg-gray-50 rounded-2xl">
                        {sellerAvatarUrl ? (
                            <Image source={{ uri: sellerAvatarUrl }} className="w-16 h-16 rounded-full" />
                        ) : (
                            <View className="items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                                <Ionicons name="person" size={28} color="#6769ef" />
                            </View>
                        )}

                        <View className="flex-1">
                            <View className="flex-row items-center gap-1.5">
                                <Text className="text-lg text-gray-900 font-display-semibold">{sellerNameValue}</Text>
                                {sellerVerifiedValue && <MaterialIcons name="verified" size={16} color="#3b82f6" />}
                            </View>
                            <Text className="mt-0.5 text-sm text-gray-500 font-display">{sellerLocationValue || 'Location not set'}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-2 mt-3">
                        <View className="flex-row items-center gap-1.5 px-3 py-2 border border-amber-100 rounded-xl bg-amber-50">
                            <Ionicons name="star" size={14} color="#f59e0b" />
                            <Text className="text-sm text-amber-700 font-display-semibold">{sellerRatingValue.toFixed(1)}</Text>
                        </View>
                        <View className="px-3 py-2 bg-gray-100 rounded-xl">
                            <Text className="text-sm text-gray-700 font-display-medium">Sales: {seller.total_sales || 0}</Text>
                        </View>
                        <View className="px-3 py-2 bg-gray-100 rounded-xl">
                            <Text className="text-sm text-gray-700 font-display-medium">Items: {storeData.stats?.totalListings || storeData.listings.length}</Text>
                        </View>
                    </View>

                    <Text className="mt-6 mb-3 text-lg text-gray-900 font-display-bold">Available Items</Text>

                    {storeData.listings.length === 0 ? (
                        <View className="items-center py-10 border border-gray-100 bg-gray-50 rounded-2xl">
                            <Text className="text-gray-500 font-display">This vendor has no active listings yet.</Text>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {storeData.listings.map((item) => (
                                <Pressable
                                    key={`${item.type}-${item.id}`}
                                    onPress={() => openListing(item)}
                                    className="flex-row gap-3 p-3 border border-gray-100 rounded-2xl"
                                >
                                    <Image
                                        source={{ uri: item.imageUrl || 'https://via.placeholder.com/120' }}
                                        className="w-20 h-20 rounded-xl"
                                    />
                                    <View className="flex-1">
                                        <Text className="text-base text-gray-900 font-display-semibold" numberOfLines={1}>{item.title}</Text>
                                        <Text className="mt-1 text-xs text-gray-500 font-display">{item.category} · {item.condition || 'N/A'}</Text>
                                        <Text className="mt-2 text-lg text-primary font-display-bold">Ksh {Number(item.price || 0).toLocaleString()}</Text>
                                        <View className="flex-row items-center gap-1 mt-1">
                                            <Ionicons name="location-outline" size={13} color="#9ca3af" />
                                            <Text className="text-xs text-gray-400 font-display">{item.location}</Text>
                                        </View>
                                    </View>
                                    <View className="items-end justify-between">
                                        <View className="px-2 py-1 rounded-lg bg-primary/10">
                                            <Text className="text-xs text-primary font-display-semibold">{item.type}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default VendorStore