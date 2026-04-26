import { View, Text, Image, ScrollView, Modal, ActivityIndicator, Alert, TextInput, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { getMyListings } from '@/lib/listingService';
import { getFavorites } from '@/lib/favoriteService';
import { Ionicons } from '@expo/vector-icons';

const MyListings = () => {
    const [activeTab, setActiveTab] = useState<string>('my listings');
    const [userData, setUserData] = useState<any>(null);
    const [myItems, setMyItems] = useState<any[]>([]);
    const [editProfile, setEditProfile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<any[]>([]);

    const theme = { accent: '#6769ef' };

    const tabs = [
        { label: 'My Listings', value: 'my listings' },
        { label: 'Favorites', value: 'favorites' },
        { label: 'Reviews', value: 'reviews' },
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);

                const listingsResult = await getMyListings() as any;
                if (listingsResult.success && listingsResult.data?.listings) {
                    const listings = listingsResult.data.listings.map((item: any) => ({
                        ...item,
                        uniqueKey: `${item.type}-${item.id}`,
                    }));
                    setMyItems(listings);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load listings');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        if (activeTab === 'favorites') {
            const fetchFavorites = async () => {
                try {
                    const result = await getFavorites() as any;
                    if (result.success && result.data?.favorites) {
                        setFavorites(result.data.favorites);
                    }
                } catch {
                    Alert.alert('Error', 'Failed to load favorites');
                }
            };
            fetchFavorites();
        }
    }, [activeTab]);

    // Shared listing card
    const ListingCard = ({ item }: { item: any }) => (
        <Pressable
            className="flex-col w-[48%] gap-2"
            onPress={() => router.push('/(tabs)/browse')}
        >
            <View className="relative overflow-hidden rounded-2xl aspect-square bg-slate-100">
                <Image source={{ uri: item.imageUrl }} className="object-cover w-full h-full" />
                <View className="absolute px-2 py-1 rounded-lg top-2 left-2 bg-white/90">
                    <Text className="text-xs tracking-wide uppercase font-display-semibold">{item.category}</Text>
                </View>
            </View>
            <View className="px-1">
                <Text className="text-base leading-tight truncate font-display-bold">{item.title}</Text>
                <Text className="text-sm font-display-bold mt-0.5" style={{ color: theme.accent }}>
                    Ksh {item.price?.toFixed(2)}
                </Text>
            </View>
        </Pressable>
    );

    return (
        <View className="flex-1 bg-white">
            {/* Tabs */}
            <View className="flex-row w-full px-4 mt-4 border-b border-gray-100">
                {tabs.map(tab => (
                    <Pressable
                        key={tab.value}
                        onPress={() => setActiveTab(tab.value)}
                        className={`flex-1 pb-3 border-b-2 ${tab.value === activeTab ? 'border-primary' : 'border-transparent'}`}
                    >
                        <Text
                            className={`text-center font-display-bold text-sm ${tab.value === activeTab ? 'text-primary' : 'text-gray-400'}`}
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Tab content */}
            {loading ? (
                <View className="items-center justify-center h-48">
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            ) : error ? (
                <View className="p-4">
                    <Text className="text-center text-red-500 font-display-bold">{error}</Text>
                </View>
            ) : activeTab === 'my listings' ? (
                <View className="flex-row flex-wrap justify-between p-4 gap-y-4">
                    {myItems.length > 0 ? (
                        myItems.slice(0, 4).map((item, index) => (
                            <ListingCard key={item.uniqueKey ?? `listing-${index}`} item={item} />
                        ))
                    ) : (
                        <Text className="w-full pt-10 text-center text-gray-400 font-display">
                            No listings yet
                        </Text>
                    )}
                    <Pressable
                        className='items-end justify-end w-full mr-8 flex-end'
                        onPress={() => router.push('/my-listings' as any)}
                    >
                        <Text className='text-xl font-semibold underline text-primary'>View All</Text>
                    </Pressable>
                </View>
            ) : activeTab === 'favorites' ? (
                <View className="flex-row flex-wrap justify-between p-4 gap-y-4">
                    {favorites.length > 0 ? (
                        favorites.map((item, index) => (
                            <ListingCard key={`favorite-${item.id ?? index}`} item={item} />
                        ))
                    ) : (
                        <Text className="w-full pt-10 text-center text-gray-400 font-display">
                            No favorites yet
                        </Text>
                    )}
                </View>
            ) : activeTab === 'orders' ? (
                <View className="p-4">
                    <Text className="text-lg text-center text-gray-500 font-display-bold">📦 Orders Coming Soon</Text>
                    <Text className="mt-2 text-center text-gray-400 font-display">Track orders placed by buyers</Text>
                </View>
            ) : (
                <View className="p-4">
                    <Text className="text-lg text-center text-gray-500 font-display-bold">🌟 Reviews Coming Soon</Text>
                    <Text className="mt-2 text-center text-gray-400 font-display">View feedback from buyers and sellers</Text>
                </View>
            )}
        </View>
    );
};

export default MyListings;