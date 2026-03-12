import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';


const ProductItemScreen = () => {
    const { id } = useLocalSearchParams();

    return (
        <SafeAreaView className='items-center flex-1 bg-white '>
            <Text>Product ID here</Text>
            <Text>{id}</Text>
        </SafeAreaView>
    )
}

export default ProductItemScreen