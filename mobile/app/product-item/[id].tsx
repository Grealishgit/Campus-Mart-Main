import { View, Text, Pressable, Image, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import map from '../../assets/images/map.png'


const ProductItemScreen = () => {
    const router = useRouter();

    const [likeProduct, setLikeProduct] = useState<boolean>(false);

    const handleLikeProduct = () => {
        setLikeProduct((prev) => !prev);

    }

    const {
        id,
        title,
        price,
        priceUnit,
        type,
        category,
        condition,
        location,
        distance,
        imageUrl,
        isVerified,
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
        distance: string;
        imageUrl: string;
        isVerified: string;
        description: string;
        sellerName: string;
        sellerRating: string;
        sellerAvatar: string;
        sellerVerified: string;
    }>();

    return (
        <SafeAreaView className='relative flex-1 bg-white'>

            <View className='absolute z-50 flex-row items-center justify-between w-full gap-4 px-4 py-3 top-8'>
                <Pressable onPress={() => router.back()} className='items-center justify-center w-12 h-12 p-1 bg-white rounded-full active:bg-gray-100'>
                    <Ionicons name="chevron-back" size={24} color="primary" />
                </Pressable>

                <View className='flex-row items-center gap-2'>
                    <Pressable onPress={() => { }} className='items-center justify-center w-12 h-12 p-1 bg-white rounded-full active:bg-gray-100'>
                        <Ionicons name="download-outline" size={24} color="primary" />
                    </Pressable>

                    <Pressable onPress={handleLikeProduct} className='items-center justify-center w-12 h-12 p-1 bg-white rounded-full active:bg-gray-100'>
                        <Ionicons name={likeProduct ? "heart" : "heart-outline"} size={24} color={likeProduct ? "#6769ef" : "gray"} />
                    </Pressable>
                </View>

            </View>
            <ScrollView className='flex flex-col w-full '>
                <Image source={{ uri: imageUrl }} className='w-full h-[450px]' resizeMode='cover' />

                <View className='flex flex-col w-full p-2'>
                    <View className='flex flex-col w-full gap-2 p-2 mt-3'>
                        <Text className='text-4xl text-black font-display-bold'>{title}</Text>
                        <Text className='text-3xl text-primary font-display-bold'>Ksh {price}
                            <Text className='ml-3 text-lg text-gray-500 font-display-medium'> Final Price</Text></Text>
                    </View>

                    <View className='flex-row justify-between w-full gap-2 p-4 mt-3 bg-white shadow-lg rounded-2xl'>
                        <View className='flex-col gap-1'>
                            <Image source={{ uri: sellerAvatar }} className='rounded-full w-14 h-14' />
                        </View>

                        <View className='flex-col flex-1 gap-1 ml-5'>
                            <Text className='text-3xl text-gray-900 font-display-semibold'>{sellerName}
                                {sellerVerified === "true" && (
                                    <MaterialIcons name="verified" size={20} color="#3b82f6" className='mt-1 ml-2' />
                                )}
                            </Text>
                            <Text className={`text-xl font-display-semibold ${sellerVerified === "true" ? "text-primary" : "text-gray-500"}`} >
                                {sellerVerified === "true" ? `Verified Seller` : `Unverified Seller`}
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


                    <View className='flex-col w-full p-4 mt-2'>
                        <Text className='text-3xl text-black font-display-bold'>ABOUT THIS ITEM</Text>
                        <Text className='mt-2 text-lg text-gray-500 font-display'>{description}</Text>
                    </View>

                    <View className='relative w-full h-48 overflow-hidden bg-blue-100 border border-gray-300 rounded-xl'>
                        <Image
                            source={map}
                            className='absolute inset-0 w-full h-full'
                            resizeMode='cover'
                        />

                        <View className='absolute inset-0 items-center justify-center bg-black/30'>
                            <Feather name="map" size={45} color="white" />
                            <Text className='text-3xl text-white font-display-bold'>{distance} km away</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>

            <View className='fixed bottom-0 flex-row w-full gap-2 p-2 px-5 bg-white'>
                <Pressable onPress={() => router.navigate('/chats')}
                    className='items-center justify-center px-4 py-3 border border-gray-400 w-[30%] rounded-2xl'>
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="gray" />
                </Pressable>
                <Pressable onPress={() => console.log(`Product ${id} : ${title} pressed`)}
                    className='items-center justify-center px-8 py-3 w-[70%] rounded-2xl bg-primary'>
                    <Text className='text-xl text-white font-display-bold'>Buy Now</Text>
                </Pressable>
            </View>

        </SafeAreaView>
    )
}

export default ProductItemScreen