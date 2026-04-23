import { View, Text, Pressable, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { getMyOrders, Order, updateOrderStatus } from '@/lib/orderService';

const getLeaseStatus = (order: Order) => {
  if (order.status === 'cancelled' || order.status === 'completed') {
    return order.status;
  }

  if (!order.leaseEnd) {
    return order.status;
  }

  const today = new Date();
  const end = new Date(`${order.leaseEnd}T00:00:00`);
  if (end < today) {
    return 'overdue';
  }

  return order.status;
};

const getDaysUntil = (dateString?: string) => {
  if (!dateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateString}T00:00:00`);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const LeaseScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchOrders = async () => {
        try {
          setLoading(true);
          setError(null);
          const result = await getMyOrders();

          if (result.success && result.data?.orders) {
            const leaseOrders = result.data.orders.filter((order) => order.type === 'LEASE');
            setOrders(leaseOrders);
          } else {
            setError(result.error || 'Failed to load leases');
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load leases');
        } finally {
          setLoading(false);
        }
      };

      fetchOrders();
    }, [])
  );

  const activeOrders = useMemo(
    () => orders.filter((order) => !['completed', 'cancelled'].includes(order.status)),
    [orders]
  );

  const historyOrders = useMemo(
    () => orders.filter((order) => ['completed', 'cancelled'].includes(order.status)),
    [orders]
  );

  const visibleOrders = activeTab === 'active' ? activeOrders : historyOrders;

  const nextReturnDays = useMemo(() => {
    const days = activeOrders
      .map((order) => getDaysUntil(order.leaseEnd))
      .filter((value) => value >= 0);

    return days.length ? Math.min(...days) : 0;
  }, [activeOrders]);

  const handleMarkReturned = async (orderId: string) => {
    try {
      setUpdatingId(orderId);
      const response = await updateOrderStatus(orderId, 'completed');

      if (response.success) {
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId ? { ...order, status: 'completed' } : order
          )
        );
        return;
      }

      Alert.alert('Update failed', response.error || 'Could not mark lease as returned.');
    } catch (err: any) {
      Alert.alert('Update failed', err.message || 'Could not mark lease as returned.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 bg-white">
        <View className="border-b border-[#d0d0e7]/30 bg-white">
          <View className="flex-row items-center justify-between w-full p-4">
            <View className="flex-row items-center gap-3">
              <Pressable className="p-2 rounded-full" onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="black" />
              </Pressable>
              <Text className="text-2xl tracking-tight font-display-bold">My Leases</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-6">
          <View className="flex-row flex-1 p-1 bg-gray-100 rounded-xl">
            <Pressable
              onPress={() => setActiveTab('active')}
              className={`flex-1 py-2.5 rounded-lg ${activeTab === 'active' ? 'bg-primary' : ''}`}
            >
              <Text className={`text-lg text-center font-display-medium ${activeTab === 'active' ? 'text-white' : 'text-gray-400'}`}>
                Active Leases
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('history')}
              className={`flex-1 py-2.5 rounded-lg ${activeTab === 'history' ? 'bg-primary' : ''}`}
            >
              <Text className={`text-lg text-center font-display-medium ${activeTab === 'history' ? 'text-white' : 'text-gray-400'}`}>
                Lease History
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-row justify-between gap-2 p-4">
          <View className="flex-1 gap-1 p-4 border rounded-lg bg-primary/10 border-primary/20">
            <Text className="tracking-wider uppercase text-md font-display-bold text-primary">Items Out</Text>
            <Text className="text-4xl text-center font-display-semibold text-primary">
              {String(activeOrders.length).padStart(2, '0')}
            </Text>
          </View>

          <View className="flex-1 gap-1 p-4 border border-orange-100 rounded-lg bg-orange-50">
            <Text className="tracking-wider text-orange-600 uppercase text-md font-display-semibold">Next Return</Text>
            <View className="flex-row justify-center gap-1">
              <Text className="text-4xl text-center text-orange-600 font-display-bold">
                {String(nextReturnDays).padStart(2, '0')}
              </Text>
              <Text className="mt-3 text-md font-display text-end text-orange-600/70">days</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {loading ? (
            <View className="items-center justify-center h-64">
              <ActivityIndicator size="large" color="#6769ef" />
            </View>
          ) : error ? (
            <View className="p-4">
              <Text className="text-center text-red-500 font-display-bold">{error}</Text>
            </View>
          ) : visibleOrders.length === 0 ? (
            <View className="px-4 pt-8">
              <Text className="text-2xl font-display-bold mb-4">
                {activeTab === 'active' ? 'Ongoing Rentals' : 'Recent History'}
              </Text>
              <Text className="py-10 text-center text-gray-500 font-display">
                No {activeTab === 'active' ? 'active rentals' : 'rental history'} yet
              </Text>
            </View>
          ) : (
            <View className="flex-col gap-4 p-4">
              {visibleOrders.map((order) => {
                const computedStatus = getLeaseStatus(order);
                const daysRemaining = getDaysUntil(order.leaseEnd);

                return (
                  <View
                    key={order.id}
                    className={`flex-col gap-2 rounded-lg bg-white p-4 border ${computedStatus === 'overdue' ? 'border-red-200' : 'border-[#d0d0e7]/50'}`}
                  >
                    <View className="flex-row gap-4">
                      <View className="overflow-hidden border border-gray-100 size-24 rounded-xl">
                        <Image
                          source={{ uri: order.listing?.imageUrl || 'https://via.placeholder.com/100' }}
                          className="w-full h-full"
                        />
                      </View>

                      <View className="flex-1 justify-between py-0.5 min-w-0">
                        <View className="flex-row items-start justify-between gap-2">
                          <View className="flex-1 min-w-0">
                            <Text className="text-lg leading-tight text-black truncate font-display-bold">
                              {order.listing?.title || 'Item'}
                            </Text>
                            <View className="flex-row mt-0.5 items-center gap-1.5">
                              <Ionicons name="person" size={16} color="#4e4f97" />
                              <Text className="truncate font-display-medium text-[#4e4f97]">
                                {order.seller?.name || 'Seller'}
                              </Text>
                            </View>
                          </View>
                          <Text
                            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              computedStatus === 'overdue'
                                ? 'bg-red-100 text-red-600'
                                : computedStatus === 'completed'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {computedStatus}
                          </Text>
                        </View>

                        <Text className="text-sm text-gray-500 font-display">
                          {order.leaseStart} to {order.leaseEnd}
                        </Text>
                        <Text className="text-sm text-gray-500 font-display">
                          Ksh {order.rate?.toFixed(2)}{order.priceUnit || ''} • Total Ksh {order.totalPrice.toFixed(2)}
                        </Text>

                        <View className="flex-row items-center gap-1.5">
                          {computedStatus === 'overdue' ? (
                            <Ionicons name="warning-outline" color="#ef4444" size={16} />
                          ) : (
                            <Ionicons name="checkmark-circle" color="#10b981" size={16} />
                          )}
                          <Text className={`text-md ${computedStatus === 'overdue' ? 'text-red-600' : 'text-green-700'} font-display-medium`}>
                            {computedStatus === 'overdue'
                              ? `Overdue by ${Math.abs(daysRemaining)} day(s)`
                              : `Due in ${Math.max(daysRemaining, 0)} day(s)`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {activeTab === 'active' && (
                      <View className="flex-row gap-2 mt-2">
                        <Pressable
                          className="items-center flex-1 p-2 py-3 border rounded-xl border-[#d0d0e7]"
                          onPress={() => handleMarkReturned(order.id)}
                          disabled={updatingId === order.id}
                        >
                          {updatingId === order.id ? (
                            <ActivityIndicator color="#6769ef" />
                          ) : (
                            <Text className="text-lg text-center font-display-medium">Mark Returned</Text>
                          )}
                        </Pressable>
                        <Pressable
                          className="items-center justify-center flex-1 p-2 py-3 rounded-xl bg-[#6769ef]/70"
                          disabled
                        >
                          <Text className="text-lg text-white font-display-medium">
                            {order.durationValue ? `${order.durationValue} ${order.durationUnit}` : 'Lease Active'}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default LeaseScreen;
