import { View, Text, Pressable, Image } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';


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
        <SafeAreaView className='items-center flex-1 bg-white'>

            <View className='relative w-full'>
                <Image source={{ uri: imageUrl }} className='w-full h-[450px]' resizeMode='cover' />

                <View className='absolute flex-row items-center justify-between w-full gap-4 px-4 py-3 top-4'>
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
            </View>

            <View className='flex flex-col w-full p-2'>
                <View className='flex flex-col w-full gap-2 p-2 mt-3'>
                    <Text className='text-4xl text-black font-display-bold'>{title}</Text>
                    <Text className='text-3xl text-primary font-display-bold'>Ksh {price}
                        <Text className='ml-3 text-lg text-gray-500 font-display-medium'> Final Price</Text></Text>
                </View>

                <View className='flex-row justify-between w-full gap-2 p-2 mt-3 rounded-full shadow'>
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
                            <Text className='text-sm text-gray-500 font-display' numberOfLines={1}>
                                {sellerRating}
                            </Text>
                        </View>
                        <Text className='text-sm italic text-gray-500 font-display'>Responds in &lt; 1 hour</Text>

                    </View>
                </View>
            </View>

        </SafeAreaView>
    )
}

export default ProductItemScreen