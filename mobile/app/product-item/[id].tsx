import { View, Text, Pressable, Image, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { addFavorite, removeFavorite, isFavorited } from '@/lib/favoriteService'
import { createConversation } from '@/lib/chatService'
import { createOrder } from '@/lib/orderService'

const ProductItemScreen = () => {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [leaseStart, setLeaseStart] = useState('');
    const [leaseEnd, setLeaseEnd] = useState('');

    const {
        id,
        title,
        price,
        priceUnit,
        type,
        category,
        condition,
        location,
        imageUrl,
        description,
        sellerName,
        sellerRating,
        sellerAvatar,
        sellerVerified,
    } = useLocalSearchParams<{
        id: string;
        title: string;
        price: string;
        priceUnit: string;
        type: string;
        category: string;
        condition: string;
        location: string;
        imageUrl: string;
        description: string;
        sellerName: string;
        sellerRating: string;
        sellerAvatar: string;
        sellerVerified: string;
    }>();

    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (id) {
                const favorited = await isFavorited(id);
                setIsFav(favorited);
            }
        };
        checkFavoriteStatus();
    }, [id]);

    const handleLikeProduct = async () => {
        try {
            setLoading(true);
            if (isFav) {
                // Remove from favorites
                const result = await removeFavorite(id);
                if (result.success) {
                    setIsFav(false);
                    Alert.alert('Removed', 'Removed from favorites');
                }
            } else {
                // Add to favorites
                const result = await addFavorite(id);
                if (result.success) {
                    setIsFav(true);
                    Alert.alert('Added', 'Added to favorites');
                }
            }
        } catch {
            Alert.alert('Error', 'Failed to update favorites');
        } finally {
            setLoading(false);
        }
    }

    const handleMessageSeller = async () => {
        try {
            // Start a conversation with the seller about this listing
            const result = await createConversation(id, `I'm interested in ${title}`);
            const conversation = result.data?.conversation;
            if (result.success && conversation?.id) {
                router.push(`/chats/chat?id=${conversation.id}`);
            } else {
                Alert.alert('Error', 'Failed to start conversation');
            }
        } catch {
            Alert.alert('Error', 'Failed to start conversation');
        }
    }

    const handleBuyNow = async () => {
        try {
            setLoading(true);
            if (type === 'LEASE' && (!leaseStart.trim() || !leaseEnd.trim())) {
                Alert.alert('Lease dates required', 'Please enter both the lease start and end dates in YYYY-MM-DD format.');
                return;
            }

            const result = await createOrder({
                listingId: id,
                leaseStart: type === 'LEASE' ? leaseStart.trim() : undefined,
                leaseEnd: type === 'LEASE' ? leaseEnd.trim() : undefined,
            });

            if (result.success && result.data?.order?.id) {
                Alert.alert('Success', type === 'LEASE' ? 'Lease created successfully.' : 'Order placed successfully.', [
                    { text: 'View Leases', onPress: () => router.push('/(tabs)/leases') },
                    { text: 'Continue Shopping', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', result.error || result.message || 'Failed to create order');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className='relative flex-1 bg-white'>
            {/* Header Buttons */}
            <View className='absolute z-50 flex-row items-center justify-between w-full gap-4 px-4 py-3 top-8'>
                <Pressable onPress={() => router.back()} className='items-center justify-center w-12 h-12 p-1 bg-white rounded-full active:bg-gray-100'>
                    <Ionicons name="chevron-back" size={24} color="#6769ef" />
                </Pressable>

                <View className='flex-row items-center gap-2'>
                    <Pressable onPress={() => {}} className='items-center justify-center w-12 h-12 p-1 bg-white rounded-full active:bg-gray-100'>
                        <Ionicons name="download-outline" size={24} color="#6769ef" />
                    </Pressable>

                    <Pressable 
                        onPress={handleLikeProduct} 
                        disabled={loading}
                        className='items-center justify-center w-12 h-12 p-1 bg-white rounded-full active:bg-gray-100'
                    >
                        {loading ? (
                            <ActivityIndicator color="#6769ef" />
                        ) : (
                            <Ionicons 
                                name={isFav ? "heart" : "heart-outline"} 
                                size={24} 
                                color={isFav ? "#6769ef" : "gray"} 
                            />
                        )}
                    </Pressable>
                </View>
            </View>

            <ScrollView className='flex flex-col w-full'>
                {/* Product Image */}
                <Image source={{ uri: imageUrl }} className='w-full h-[450px]' resizeMode='cover' />

                <View className='flex flex-col w-full p-2'>
                    {/* Title and Price */}
                    <View className='flex flex-col w-full gap-2 p-2 mt-3'>
                        <Text className='text-4xl text-black font-display-bold'>{title}</Text>
                        <Text className='text-3xl text-primary font-display-bold'>
                            Ksh {price}
                            <Text className='ml-3 text-lg text-gray-500 font-display-medium'>
                                {type === 'LEASE' ? ` ${priceUnit || ''}` : ' Final Price'}
                            </Text>
                        </Text>
                    </View>

                    {/* Seller Info */}
                    <View className='flex-row justify-between w-full gap-2 p-4 mt-3 bg-white shadow-lg rounded-2xl'>
                        <View className='flex-col gap-1'>
                            <Image source={{ uri: sellerAvatar }} className='rounded-full w-14 h-14' />
                        </View>

                        <View className='flex-col flex-1 gap-1 ml-5'>
                            <Text className='text-3xl text-gray-900 font-display-semibold'>
                                {sellerName}
                                {sellerVerified === "true" && (
                                    <MaterialIcons name="verified" size={20} color="#3b82f6" className='mt-1 ml-2' />
                                )}
                            </Text>
                            <Text className={`text-xl font-display-semibold ${sellerVerified === "true" ? "text-primary" : "text-gray-500"}`}>
                                {sellerVerified === "true" ? "Verified Seller" : "Unverified Seller"}
                            </Text>
                        </View>

                        <View className='flex-col items-end gap-1 p-1'>
                            <View className='flex-row gap-2 p-1 mr-2 bg-yellow-100 rounded-lg'>
                                <Ionicons name="star" size={16} color="#fbbf24" />
                                <Text className='text-orange-900 text-md font-display-semibold' numberOfLines={1}>
                                    {sellerRating}
                                </Text>
                            </View>
                            <Text className='text-sm italic text-gray-500 font-display'>Responds in &lt; 1 hour</Text>
                        </View>
                    </View>

                    {/* Product Details Grid */}
                    <View className='flex-row justify-between w-full gap-1 p-2 mt-3'>
                        <View className='flex-col items-center justify-center flex-1 p-2 bg-white border border-gray-300 rounded-lg shadow-xl'>
                            <Feather name="box" size={24} color="#6769ef" />
                            <Text className='text-xl font-display-bold text-primary'>Condition</Text>
                            <Text className='text-sm text-gray-400 font-display-medium'>{condition}</Text>
                        </View>

                        <View className='flex-col items-center justify-center flex-1 p-2 bg-white border border-gray-300 rounded-lg shadow-xl'>
                            <Ionicons name="location-outline" size={24} color="#6769ef" />
                            <Text className='text-xl font-display-bold text-primary'>Pickup</Text>
                            <Text className='text-sm text-gray-500 font-display-medium'>{location}</Text>
                        </View>

                        <View className='flex-col items-center justify-center flex-1 p-2 bg-white border border-gray-300 rounded-lg shadow-xl'>
                            <MaterialCommunityIcons name="progress-helper" size={24} color="#6769ef" />
                            <Text className='text-xl font-display-bold text-primary'>Availability</Text>
                            <Text className='text-sm text-gray-500 font-display-medium'>{category}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View className='flex-col w-full p-4 mt-2'>
                        <Text className='text-3xl text-black font-display-bold'>ABOUT THIS ITEM</Text>
                        <Text className='mt-2 text-lg text-gray-500 font-display'>{description}</Text>
                    </View>

                    {type === 'LEASE' && (
                        <View className='w-full px-4 pb-6'>
                            <Text className='text-2xl text-black font-display-bold'>LEASE DETAILS</Text>
                            <Text className='mt-1 text-base text-gray-500 font-display'>
                                Rate: Ksh {price}{priceUnit || ''}. Enter your dates before sending the request.
                            </Text>

                            <TextInput
                                value={leaseStart}
                                onChangeText={setLeaseStart}
                                placeholder='Lease start (YYYY-MM-DD)'
                                placeholderTextColor='#9ca3af'
                                className='mt-4 rounded-2xl border border-gray-300 px-4 py-3 text-base font-display text-gray-900'
                            />
                            <TextInput
                                value={leaseEnd}
                                onChangeText={setLeaseEnd}
                                placeholder='Lease end (YYYY-MM-DD)'
                                placeholderTextColor='#9ca3af'
                                className='mt-3 rounded-2xl border border-gray-300 px-4 py-3 text-base font-display text-gray-900'
                            />
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Bottom Action Buttons */}
            <View className='fixed bottom-0 flex-row w-full gap-2 p-2 px-5 bg-white border-t border-gray-200'>
                <Pressable 
                    onPress={handleMessageSeller}
                    className='items-center justify-center px-4 py-3 border border-gray-400 w-[30%] rounded-2xl'
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="gray" />
                </Pressable>
                
                <Pressable 
                    onPress={handleBuyNow}
                    disabled={loading}
                    className='items-center justify-center px-8 py-3 w-[70%] rounded-2xl bg-primary'
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className='text-xl text-white font-display-bold'>
                            {type === 'LEASE' ? 'Rent Now' : 'Buy Now'}
                        </Text>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

export default ProductItemScreen
