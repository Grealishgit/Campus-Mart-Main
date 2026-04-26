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

const parseDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00`);
  return isNaN(date.getTime()) ? null : date;
};

const getDaysUntil = (dateString?: string): number => {
  if (!dateString) return 0;

  // Handle PostgreSQL date format directly
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const endDate = new Date(year, month - 1, day);

  if (isNaN(endDate.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };

    return date.toLocaleDateString(undefined, options);
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
          <View className="flex-row p-1 bg-gray-100 rounded-xl">
            <Pressable
              onPress={() => setActiveTab('active')}
              className={`flex-1 py-2.5 rounded-lg ${activeTab === 'active' ? 'bg-primary' : ''}`}
            >
              <Text className={`text-lg text-center font-display-medium ${activeTab === 'active' ? 'text-white' : 'text-gray-600'}`}>
                Active Leases
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('history')}
              className={`flex-1 py-2.5 rounded-lg ${activeTab === 'history' ? 'bg-primary' : ''}`}
            >
              <Text className={`text-lg text-center font-display-medium ${activeTab === 'history' ? 'text-white' : 'text-gray-600'}`}>
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
              <View className="p-6 mx-4 mt-8 bg-red-50 rounded-xl">
                <Text className="text-center text-red-600 font-display-medium">{error}</Text>
                <Pressable
                  onPress={() => window.location.reload()}
                  className="items-center px-4 py-2 mt-3 bg-red-100 rounded-lg"
                >
                  <Text className="text-red-600 font-display-medium">Try Again</Text>
                </Pressable>
              </View>
            ) : visibleOrders.length === 0 ? (
                <View className="items-center justify-center px-4 py-20">
                  <Ionicons
                    name={activeTab === 'active' ? "cube-outline" : "time-outline"}
                    size={64}
                    color="#d1d5db"
                  />
                  <Text className="mt-4 text-xl text-center text-gray-800 font-display-bold">
                    {activeTab === 'active' ? 'No Active Rentals' : 'No Rental History'}
                  </Text>
                  <Text className="mt-2 text-center text-gray-500 font-display">
                    {activeTab === 'active'
                      ? 'You don\'t have any ongoing rentals at the moment'
                      : 'Your completed rentals will appear here'}
                  </Text>
                </View>
              ) : (
                  <>
                    {/* Header Section */}
                    <View className="px-4 pt-4 pb-2">
                      <Text className="text-2xl font-display-bold">
                        {activeTab === 'active' ? '📦 Ongoing Rentals' : '📋 Recent History'}
                      </Text>
                      <Text className="mt-1 text-gray-500 font-display">
                        {visibleOrders.length} {visibleOrders.length === 1 ? 'item' : 'items'}
                      </Text>
                    </View>

                    {/* Orders List */}
                    <View className="flex-col gap-4 p-4">
                      {visibleOrders.map((order) => {
                        const computedStatus = getLeaseStatus(order);
                        const daysRemaining = getDaysUntil(order.leaseEnd);

                        return (
                          <View
                            key={order.id}
                            className={`rounded-xl bg-white p-4 border ${computedStatus === 'overdue'
                              ? 'border-red-200 bg-red-50/30'
                              : 'border-gray-100 shadow-sm'
                              }`}
                          >
                            {/* Main Content */}
                            <View className="flex-row gap-4">
                              {/* Image */}
                              <View className="overflow-hidden bg-gray-100 rounded-xl size-24">
                                <Image
                                  source={{ uri: order.listing?.imageUrl || 'https://via.placeholder.com/100' }}
                                  className="w-full h-full"
                                  resizeMode="cover"
                                />
                              </View>

                              {/* Details */}
                              <View className="flex-1 gap-1.5">
                                {/* Title and Status Row */}
                                <View className="flex-row items-start justify-between gap-2">
                                  <View className="flex-1">
                                    <Text className="text-lg leading-tight text-gray-900 font-display-bold" numberOfLines={2}>
                                      {order.listing?.title || 'Untitled Item'}
                                    </Text>
                                    {/* Seller Info */}
                                    <View className="flex-row items-center gap-1.5 mt-1">
                                      <Ionicons name="person-circle-outline" size={16} color="#6b7280" />
                                      <Text className="text-sm text-gray-600 font-display-medium">
                                        {order.seller?.name || 'Unknown Seller'}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Status Badge */}
                                  <View
                                    className={`px-2.5 py-1 rounded-full ${computedStatus === 'overdue'
                                      ? 'bg-red-100'
                                      : computedStatus === 'completed'
                                        ? 'bg-gray-100'
                                        : 'bg-green-100'
                                      }`}
                                  >
                                    <Text
                                      className={`text-xs font-bold uppercase tracking-wide ${computedStatus === 'overdue'
                                        ? 'text-red-600'
                                        : computedStatus === 'completed'
                                          ? 'text-gray-600'
                                          : 'text-green-600'
                                        }`}
                                    >
                                      {computedStatus}
                                    </Text>
                                  </View>
                                </View>

                                {/* Rental Period */}
                                <View className="flex-row items-center gap-2 mt-1">
                                  <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                                  <Text className="text-sm text-gray-600 font-display">
                                    {formatDate(order.leaseStart)} → {formatDate(order.leaseEnd)}
                                  </Text>
                                </View>

                                {/* Pricing */}
                                <View className="flex-row items-baseline gap-2 mt-1">
                                  <Text className="text-base font-bold text-primary font-display-bold">
                                    Ksh {order.rate?.toFixed(2)}
                                  </Text>
                                  <Text className="text-sm text-gray-500 font-display">
                                    / {order.priceUnit || 'day'}
                                  </Text>
                                  <View className="w-px h-4 mx-1 bg-gray-300" />
                                  <Text className="text-sm text-gray-700 font-display-medium">
                                    Total: Ksh {order.totalPrice.toFixed(2)}
                                  </Text>
                                </View>

                                {/* Days Remaining/Overdue */}
                                <View className="flex-row items-center gap-1.5 mt-1">
                                  {computedStatus === 'overdue' ? (
                                    <>
                                      <Ionicons name="alert-circle" size={16} color="#ef4444" />
                                      <Text className="text-sm text-green-600 font-display-medium">
                                        {isNaN(daysRemaining)
                                          ? 'Date unavailable'
                                          : daysRemaining === 0
                                            ? 'Ends today'
                                            : `${Math.max(daysRemaining, 0)} day${Math.max(daysRemaining, 0) !== 1 ? 's' : ''} remaining`}
                                      </Text>
                                    </>
                                  ) : computedStatus === 'completed' ? (
                                    <>
                                      <Ionicons name="checkmark-done-circle" size={16} color="#6b7280" />
                                      <Text className="text-sm text-gray-600 font-display-medium">
                                        Completed on {formatDate(order.leaseEnd)}
                                      </Text>
                                    </>
                                  ) : (
                                        <>
                                          <Ionicons name="time-outline" size={16} color="#10b981" />
                                          <Text className="text-sm text-green-600 font-display-medium">
                                            {daysRemaining === 0
                                              ? 'Ends today'
                                              : `${Math.max(daysRemaining, 0)} day${Math.max(daysRemaining, 0) !== 1 ? 's' : ''} remaining`}
                                          </Text>
                                    </>
                                  )}
                                </View>
                              </View>
                            </View>

                            {/* Action Buttons (Active tab only) */}
                            {activeTab === 'active' && computedStatus !== 'completed' && (
                              <View className="flex-row gap-3 pt-3 mt-4 border-t border-gray-100">
                                <Pressable
                                  className="flex-1 py-3 rounded-xl bg-primary/10"
                                  onPress={() => handleMarkReturned(order.id)}
                                  disabled={updatingId === order.id}
                                >
                                  {updatingId === order.id ? (
                                    <ActivityIndicator color="#6769ef" size="small" />
                                  ) : (
                                    <Text className="text-center text-primary font-display-semibold">
                                      Mark Returned
                                    </Text>
                                  )}
                                </Pressable>
                                <Pressable
                                  className="flex-1 py-3 rounded-xl bg-primary"
                                  disabled
                                >
                                  <Text className="text-center text-white font-display-semibold">
                                    {order.durationValue
                                      ? `${order.durationValue} ${order.durationUnit}`
                                      : 'Active'}
                                  </Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default LeaseScreen;
