import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';


const ProductItemScreen = () => {
    const router = useRouter();
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
            <View className='flex-row items-center w-full gap-4 px-4 py-3 border-b border-gray-100'>
                <Pressable onPress={() => router.back()} className='items-center justify-center w-10 h-10 rounded-full active:bg-gray-100'>
                    <Ionicons name="chevron-back" size={24} color="primary" />
                </Pressable>
                <Text>Product ID: {id}</Text>
                <Text>Title: {title}</Text>
            </View>

        </SafeAreaView>
    )
}

export default ProductItemScreen