import { View, Text, Pressable, Image, ScrollView, ActivityIndicator, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons';
import { getOrders } from '@/lib/orderService'
import { useFocusEffect } from 'expo-router'

const LeaseScreen = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [itemsOut, setItemsOut] = useState(0);
    const [nextReturnDays, setNextReturnDays] = useState(0);

    useFocusEffect(
      React.useCallback(() => {
        fetchOrders();
      }, [activeTab])
    );

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch orders for current tab
        const endpoint = activeTab === 'active' ? 'my' : 'history';
        const result = await getOrders(endpoint);
        
        if (result.success && result.data?.orders) {
          setOrders(result.data.orders);
          
          // Calculate stats
          const activeOrders = result.data.orders.filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled');
          setItemsOut(activeOrders.length);
          
          // Find next return date
          if (activeOrders.length > 0) {
            const nextReturn = activeOrders.reduce((min: any, order: any) => {
              const days = Math.ceil((new Date(order.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return days < Math.ceil((new Date(min.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) ? order : min;
            });
            const daysRemaining = Math.ceil((new Date(nextReturn.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            setNextReturnDays(Math.max(0, daysRemaining));
          }
        } else {
          setError(result.error || 'Failed to load orders');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    return (
        <SafeAreaView className='flex-1'>

            <View className="flex-col flex-1 h-full overflow-hidden bg-white">

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

                <View className="w-full overflow-y-auto ">
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



                </View>

                <View className="flex-row justify-between gap-2 p-4">
                        <View className="flex flex-col flex-1 gap-1 p-4 border rounded-lg bg-primary/10 border-primary/20">
                            <Text className="tracking-wider uppercase text-md font-display-bold text-primary">Items Out</Text>
                            <Text className="text-4xl text-center font-display-semibold text-primary">{String(itemsOut).padStart(2, '0')}</Text>
                        </View>

                        <View className="flex flex-col flex-1 gap-1 p-4 border border-orange-100 rounded-lg bg-orange-50 ">
                            <Text className="tracking-wider text-orange-600 uppercase text-md font-display-semibold">Next Return</Text>
                            <View className="flex-row justify-center gap-1">
                                <Text className="text-4xl text-center text-orange-600 font-display-bold">{String(nextReturnDays).padStart(2, '0')}</Text>
                                <Text className="mt-3 text-md font-display text-end text-orange-600/70">days</Text>
                            </View>
                        </View>
                    </View>


                <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
                    {loading ? (
                      <View className="flex justify-center items-center h-64">
                        <ActivityIndicator size="large" color="#6769ef" />
                      </View>
                    ) : error ? (
                      <View className="p-4">
                        <Text className="text-center text-red-500 font-display-bold">{error}</Text>
                      </View>
                    ) : orders.length === 0 ? (
                      <View className="px-4 pt-8">
                        <Text className="text-2xl font-display-bold mb-4">
                          {activeTab === 'active' ? 'Ongoing Rentals' : 'Recent History'}
                        </Text>
                        <Text className="text-center text-gray-500 font-display py-10">
                          No {activeTab === 'active' ? 'active rentals' : 'rental history'} yet
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View className="px-4 pt-2">
                          <Text className="text-2xl font-display-bold">
                            {activeTab === 'active' ? 'Ongoing Rentals' : 'Recent History'}
                          </Text>
                        </View>

                        <View className="flex-col gap-4 p-4">
                          {orders.map((order: any) => (
                            <View key={order.id}
                                className={`flex-col gap-2 rounded-lg bg-white p-4 border ${order.status === 'overdue' ? 'border-2 border-red-100 ' : 'border-[#d0d0e7]/50'}`}>

                                <View className="flex-row gap-4">
                                    <View className="overflow-hidden border border-gray-100 size-24 rounded-xl">
                                        <Image source={{ uri: order.listing?.imageUrl || 'https://via.placeholder.com/100' }} className="object-cover w-full h-full" />
                                    </View>

                                    <View className="flex flex-col justify-between flex-1 py-0.5 min-w-0">

                                        <View className="flex-row items-start justify-between gap-2">
                                            <View className="flex-1 min-w-0">
                                                <Text className="text-lg leading-tight text-black truncate font-display-bold">{order.listing?.title || 'Item'}
                                                </Text>
                                                <View className="flex-row mt-0.5 items-center gap-1.5 text-[#4e4f97] text-xs">
                                                    <Ionicons name="person" size={16} color="#4e4f97" />
                                                    <Text className="truncate font-display-medium text-[#4e4f97]">{order.seller?.name || 'Seller'}</Text>
                                                </View>
                                            </View>
                                            <Text className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                                {order.status}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center gap-1.5">
                                            {order.status === 'overdue' ? <Ionicons name='warning-outline' color='#ef4444' size={16} /> : <Ionicons name='checkmark-circle' color='#10b981' size={16} />}
                                            <Text className={`text-md ${order.status === 'overdue' ? 'text-red-600' : 'text-green-700'} font-display-medium`}>
                                              Due: {new Date(order.due_date).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="flex-row gap-2 mt-2">
                                    <Pressable className="flex-1 p-2 py-3 rounded-xl border border-[#d0d0e7]  items-center">
                                        <Text className='text-lg text-center font-display-medium'>Mark Returned</Text>
                                    </Pressable>
                                    <Pressable className={`flex-1 p-2 py-3 flex-row rounded-xl  
                                        ${order.status === 'overdue' ? 'bg-[#a4a5f5]' : 'bg-[#6769ef]'}  flex items-center justify-center gap-2 shadow-lg shadow-primary/20 `}>
                                        <Ionicons name="calendar" size={16} color="white" />
                                        <Text className='text-lg text-white font-display-medium'>Extend Lease</Text>
                                    </Pressable>
                                </View>
                            </View>
                          ))}
                        </View>
                      </>
                    )}

                </ScrollView>


            </View>
        </SafeAreaView>
    )
}

export default LeaseScreen