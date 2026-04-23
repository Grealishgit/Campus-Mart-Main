import { Pressable, StyleSheet, ScrollView, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


const AdminOrdersPage = () => {
    const router = useRouter();
    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            <View className="flex-row border-b border-[#242323] items-center px-5 py-4">
                <Pressable
                    onPress={() => router.back()}
                    className="items-center justify-center mr-3 rounded-full h-11 w-11 bg-white/10"
                >
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </Pressable>
                <View>
                    <Text className="text-2xl text-white font-display-bold">
                        Order Management
                    </Text>
                    <Text className="text-slate-400 font-display">
                        View and manage orders.
                    </Text>
                </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text className='text-xl text-white'>orders</Text>
            </ScrollView>

        </SafeAreaView>
    )
}

export default AdminOrdersPage

const styles = StyleSheet.create({})