import { View, Text, Pressable, Image } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';


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

        </SafeAreaView>
    )
}

export default ProductItemScreen