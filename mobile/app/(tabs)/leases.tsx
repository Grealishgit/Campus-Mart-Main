import { View, Text, Pressable, Image } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons';

const LeaseScreen = () => {


    const activeLeases = [
        {
            id: '1',
            title: 'Scientific Calculator',
            seller: 'Alex Rivera',
            due: 'Oct 24, 2023',
            status: 'Active',
            imageUrl: 'https://picsum.photos/seed/calc1/200'
        },
        {
            id: '2',
            title: 'Electric Scooter',
            seller: 'Sarah Jenkins',
            due: 'Oct 15 (4 days ago)',
            status: 'Overdue',
            imageUrl: 'https://picsum.photos/seed/scooter/200'
        }
    ];


    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    return (
        <SafeAreaView className='flex-1'>
            <View className="flex flex-col h-full overflow-hidden bg-white">

                <View className="sticky top-0 z-50 bg-background-light/80backdrop-blur-md border-b border-[#d0d0e7]/30">
                    <View className="flex-row items-center justify-between w-full p-4">
                        <View className="flex-row items-center gap-3">
                            <Pressable className="p-2 rounded-full hover:bg-gray-100">
                                <Ionicons name="chevron-back" size={24} color="black" />
                            </Pressable>
                            <Text className="text-2xl tracking-tight font-display-bold">My Leases</Text>
                        </View>
                        <View className="relative">
                            <Pressable className="p-2 hover:bg-gray-100">
                                <Ionicons name="notifications-outline" size={24} color="black" />
                                <View className="absolute flex w-2 h-2 bg-[#6769ef] rounded-full top-2 right-2 ring-2 ring-white" /> 
                            </Pressable>

                        </View>
                    </View>
                </View>

                <View className="flex-1 w-full pb-32 overflow-y-auto ">
                    <View className="flex-row justify-between px-4 pt-6">
                        <View className="flex-row flex-1 p-1 bg-gray-100 rounded-xl">
                            <Pressable onPress={() => setActiveTab('active')} className={`flex-1 py-2.5 text-lg font-display-medium rounded-lg ${activeTab === 'active' ? 'bg-primary text-white shadow-sm' : 'text-gray-400'}`}>
                                <Text className={`text-lg text-center font-display-medium ${activeTab === 'active' ? 'text-white shadow-sm' : 'text-gray-400'}`}>
                                    Active Leases
                                </Text>

                            </Pressable>
                            <Pressable onPress={() => setActiveTab('history')} className={`flex-1 py-2.5 rounded-lg ${activeTab === 'history' ? 'bg-primary' : ''}`}>
                                <Text className={`text-lg text-center font-display-medium ${activeTab === 'history' ? 'text-white shadow-sm' : 'text-gray-400'}`}>
                                    Lease History
                                </Text>
                            </Pressable>
                        </View>
                    </View>


                    <View className="flex gap-3 p-4">
                        <View className="flex flex-col flex-1 gap-1 p-4 border rounded-2xl bg-primary/10 border-primary/20">
                            <Text className="text-xs font-bold tracking-wider uppercase text-primary">Items Out</Text>
                            <Text className="text-2xl font-black text-primary">02</Text>
                        </View>
                        <View className="flex flex-col flex-1 gap-1 p-4 border border-orange-100 rounded-2xl bg-orange-50 ">
                            <Text className="text-xs font-bold tracking-wider text-orange-600 uppercase">Next Return</Text>
                            <View className="flex items-baseline gap-1">
                                <Text className="text-2xl font-black text-orange-600">04</Text>
                                <Text className="text-xs font-medium text-orange-600/70">days</Text>
                            </View>
                        </View>
                    </View>

                    <View className="px-4 pt-2">
                        <Text className="text-lg font-bold">Ongoing Rentals</Text>
                    </View>

                    <View className="p-4 space-y-4">
                        {activeLeases.map(lease => (
                            <View key={lease.id} className={`flex flex-col gap-4 rounded-2xl bg-white  p-4 ios-shadow border ${lease.status === 'Overdue' ? 'border-2 border-red-100 ' : 'border-[#d0d0e7]/50'}`}>
                                <View className="flex gap-4">
                                    <View className="overflow-hidden border border-gray-100 size-24 rounded-xl">
                                        <Image src={lease.imageUrl} alt={lease.title} className="object-cover w-full h-full" />
                                    </View>
                                    <View className="flex flex-col justify-between flex-1 py-0.5 min-w-0">
                                        <View className="flex items-start justify-between gap-2">
                                            <View className="flex-1 min-w-0">
                                                <Text className="text-lg font-bold leading-tight truncate">{lease.title}</Text>
                                                <View className="flex items-center gap-1.5 text-[#4e4f97] text-xs">
                                                    <Text className="text-base material-symbols-outlined">person</Text>
                                                    <Text className="truncate">{lease.seller}</Text>
                                                </View>
                                            </View>
                                            <Text className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${lease.status === 'Overdue' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                                {lease.status}
                                            </Text>
                                        </View>
                                        <View className={`flex items-center gap-1.5 text-xs ${lease.status === 'Overdue' ? 'text-red-600 font-bold' : 'text-[#4e4f97]'}`}>
                                            <Text className="text-base material-symbols-outlined">{lease.status === 'Overdue' ? 'warning' : 'calendar_today'}</Text>
                                            <Text>Due: {lease.due}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="flex gap-2">
                                    <Pressable className="flex-1 h-10 rounded-xl border border-[#d0d0e7] text-sm font-semibold hover:bg-gray-50">Mark Returned</Pressable>
                                    <Pressable className={`flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 ${lease.status === 'Overdue' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                        <Text className="text-lg material-symbols-outlined">history_edu</Text>
                                        Extend Lease
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View className="px-4 py-4 mt-2">
                        <View className="flex items-center justify-between mb-4">
                            <Text className="text-lg font-bold">Recent History</Text>
                            <Pressable className="text-sm font-bold text-primary">See All</Pressable>
                        </View>
                        <View className="bg-white  rounded-2xl p-4 flex items-center gap-4 border border-[#d0d0e7]/30 opacity-75">
                            <View className="flex items-center justify-center bg-gray-100 rounded-lg size-12 ">
                                <Text className="text-gray-400 material-symbols-outlined">photo_camera</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-bold">DSLR Camera Canon</Text>
                                <Text className="text-xs text-gray-500">Returned Sept 12</Text>
                            </View>
                            <View className="flex items-center gap-0.5">
                                <Text className="text-sm text-yellow-400 material-symbols-outlined fill-1" >star</Text>
                                <Text className="text-xs font-bold">5.0</Text>
                            </View>
                        </View>
                    </View>
                </View>

            </View>
        </SafeAreaView>
    )
}

export default LeaseScreen