import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, Image, Pressable,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import {
    getMyOrders, getSellingOrders,
    updateOrderStatus, Order,
} from '@/lib/orderService';

// ─── helpers ─────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: '#fef9c3', text: '#854d0e', dot: '#eab308' },
    confirmed: { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
    completed: { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
    cancelled: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
};

const fmt = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-KE', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

// ─── sub-components ───────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
    return (
        <View
            className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ backgroundColor: s.bg }}
        >
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
            <Text className="text-[11px] font-display-semibold capitalize" style={{ color: s.text }}>
                {status}
            </Text>
        </View>
    );
};

interface OrderCardProps {
    order: Order;
    perspective: 'buying' | 'selling';
    onStatusUpdate: (id: string, status: Order['status']) => void;
    updating: string | null;
}

const OrderCard = ({ order, perspective, onStatusUpdate, updating }: OrderCardProps) => {
    const isLease = order.type === 'LEASE';
    const isActive = !['completed', 'cancelled'].includes(order.status);
    const other = perspective === 'buying' ? order.seller : order.buyer;

    const sellerActions: Order['status'][] =
        order.status === 'pending' ? ['confirmed', 'cancelled'] :
            order.status === 'confirmed' ? ['completed', 'cancelled'] : [];

    const buyerActions: Order['status'][] =
        order.status === 'pending' ? ['cancelled'] : [];

    const actions = perspective === 'selling' ? sellerActions : buyerActions;

    const ACTION_LABEL: Record<string, { label: string; color: string; bg: string }> = {
        confirmed: { label: 'Confirm', color: '#1e40af', bg: '#dbeafe' },
        completed: { label: 'Complete', color: '#166534', bg: '#dcfce7' },
        cancelled: { label: 'Cancel', color: '#991b1b', bg: '#fee2e2' },
    };

    return (
        <View className="mb-4 overflow-hidden bg-white border border-gray-100 rounded-2xl"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
        >
            {/* Image + main info */}
            <View className="flex-row gap-3 p-4">
                <View className="overflow-hidden bg-gray-100 rounded-xl" style={{ width: 76, height: 76 }}>
                    <Image
                        source={{ uri: order.listing?.imageUrl || 'https://via.placeholder.com/76' }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View>

                <View className="justify-between flex-1">
                    <View className="flex-row items-start justify-between gap-2">
                        <Text className="flex-1 text-base leading-tight text-gray-900 font-display-bold" numberOfLines={2}>
                            {order.listing?.title || 'Listing'}
                        </Text>
                        <StatusBadge status={order.status} />
                    </View>

                    {/* Type chip */}
                    <View className="flex-row items-center gap-2 mt-1">
                        <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: isLease ? '#ede9fe' : '#d1fae5' }}
                        >
                            <Text
                                className="text-[10px] uppercase tracking-wider font-display-bold"
                                style={{ color: isLease ? '#6d28d9' : '#065f46' }}
                            >
                                {order.type}
                            </Text>
                        </View>
                        {order.listing?.category && (
                            <Text className="text-xs text-gray-400 font-display">{order.listing.category}</Text>
                        )}
                    </View>

                    {/* Counterpart */}
                    {other?.name && (
                        <View className="flex-row items-center gap-1 mt-1">
                            <Ionicons
                                name={perspective === 'buying' ? 'storefront-outline' : 'person-outline'}
                                size={12}
                                color="#9ca3af"
                            />
                            <Text className="text-xs text-gray-400 font-display">
                                {perspective === 'buying' ? 'Seller' : 'Buyer'}: {other.name}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Divider */}
            <View className="h-px mx-4 bg-gray-50" />

            {/* Price + dates row */}
            <View className="flex-row items-center justify-between px-4 py-3">
                <View>
                    <Text className="text-xs text-gray-400 font-display">Total</Text>
                    <Text className="text-lg text-primary font-display-bold">
                        Ksh {order.totalPrice.toLocaleString()}
                    </Text>
                    {isLease && order.rate && (
                        <Text className="text-[11px] text-gray-400 font-display">
                            Ksh {order.rate.toLocaleString()}{order.priceUnit || ''}
                        </Text>
                    )}
                </View>

                {isLease && (order.leaseStart || order.leaseEnd) ? (
                    <View className="items-end">
                        <View className="flex-row items-center gap-1">
                            <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                            <Text className="text-xs text-gray-500 font-display">
                                {fmt(order.leaseStart)} → {fmt(order.leaseEnd)}
                            </Text>
                        </View>
                        {order.durationValue != null && (
                            <Text className="text-[11px] text-gray-400 font-display mt-0.5">
                                {order.durationValue} {order.durationUnit}
                            </Text>
                        )}
                    </View>
                ) : (
                    <View className="items-end">
                        <Ionicons name="time-outline" size={12} color="#9ca3af" />
                        <Text className="text-[11px] text-gray-400 font-display mt-0.5">
                            {fmt(order.createdAt)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Action buttons */}
            {isActive && actions.length > 0 && (
                <>
                    <View className="h-px mx-4 bg-gray-50" />
                    <View className="flex-row gap-2 px-4 py-3">
                        {actions.map((action) => {
                            const a = ACTION_LABEL[action];
                            return (
                                <Pressable
                                    key={action}
                                    onPress={() => onStatusUpdate(order.id, action)}
                                    disabled={updating === order.id}
                                    className="flex-1 items-center justify-center py-2.5 rounded-xl"
                                    style={{ backgroundColor: a.bg }}
                                >
                                    {updating === order.id ? (
                                        <ActivityIndicator size="small" color={a.color} />
                                    ) : (
                                        <Text className="text-sm font-display-semibold" style={{ color: a.color }}>
                                            {a.label}
                                        </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </>
            )}
        </View>
    );
};

// ─── main screen ─────────────────────────────────────────────

type Perspective = 'buying' | 'selling';
type Tab = 'active' | 'history';

const OrdersScreen = () => {
    const router = useRouter();

    const [perspective, setPerspective] = useState<Perspective>('buying');
    const [tab, setTab] = useState<Tab>('active');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = perspective === 'buying'
                ? await getMyOrders()
                : await getSellingOrders();

            if (result.success && result.data?.orders) {
                setOrders(result.data.orders);
            } else {
                setError(result.error || 'Failed to load orders');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [perspective]);

    useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

    const activeOrders = useMemo(() => orders.filter(o => !['completed', 'cancelled'].includes(o.status)), [orders]);
    const historyOrders = useMemo(() => orders.filter(o => ['completed', 'cancelled'].includes(o.status)), [orders]);
    const visibleOrders = tab === 'active' ? activeOrders : historyOrders;

    const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
        Alert.alert(
            `${status.charAt(0).toUpperCase() + status.slice(1)} order`,
            `Are you sure you want to mark this order as ${status}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setUpdating(orderId);
                            const result = await updateOrderStatus(orderId, status);
                            if (result.success && result.data?.order) {
                                setOrders(prev =>
                                    prev.map(o => o.id === orderId ? { ...o, status } : o)
                                );
                            } else {
                                Alert.alert('Failed', result.error || 'Could not update order.');
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Could not update order.');
                        } finally {
                            setUpdating(null);
                        }
                    },
                },
            ]
        );
    };

    // summary stats
    const stats = useMemo(() => [
        { label: 'Active', value: activeOrders.length, color: '#6769ef' },
        { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#22c55e' },
        { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: '#ef4444' },
    ], [orders, activeOrders]);

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Pressable
                    onPress={() => router.back()}
                    className="items-center justify-center w-10 h-10 rounded-full active:bg-gray-50"
                >
                    <Ionicons name="chevron-back" size={22} color="#111827" />
                </Pressable>
                <Text className="text-xl text-gray-900 font-display-bold">Orders</Text>
                <Pressable onPress={fetchOrders} className="items-center justify-center w-10 h-10 rounded-full active:bg-gray-50">
                    <Ionicons name="refresh-outline" size={20} color="#6769ef" />
                </Pressable>
            </View>

            {/* Perspective toggle */}
            <View className="flex-row p-1 m-4 bg-gray-100 rounded-xl">
                {(['buying', 'selling'] as Perspective[]).map(p => (
                    <Pressable
                        key={p}
                        onPress={() => { setPerspective(p); setTab('active'); }}
                        className={`flex-1 py-2.5 rounded-lg items-center ${perspective === p ? 'bg-primary' : ''}`}
                    >
                        <Text className={`text-sm font-display-semibold capitalize ${perspective === p ? 'text-white' : 'text-gray-500'}`}>
                            {p === 'buying' ? 'Buying' : 'Selling'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Stats row */}
            <View className="flex-row gap-3 px-4 mb-4">
                {stats.map(s => (
                    <View key={s.label} className="items-center flex-1 py-3 border border-gray-100 bg-gray-50 rounded-xl">
                        <Text className="text-xl font-display-bold" style={{ color: s.color }}>
                            {String(s.value).padStart(2, '0')}
                        </Text>
                        <Text className="text-[10px] text-gray-400 font-display-medium uppercase tracking-wider mt-0.5">
                            {s.label}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Active / History tabs */}
            <View className="flex-row px-4 mb-4 border-b border-gray-100">
                {(['active', 'history'] as Tab[]).map(t => (
                    <Pressable
                        key={t}
                        onPress={() => setTab(t)}
                        className={`flex-1 pb-3 border-b-2 ${tab === t ? 'border-primary' : 'border-transparent'}`}
                    >
                        <Text className={`text-center text-sm font-display-semibold capitalize ${tab === t ? 'text-primary' : 'text-gray-400'}`}>
                            {t === 'active' ? `Active (${activeOrders.length})` : `History (${historyOrders.length})`}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Content */}
            {loading ? (
                <View className="items-center justify-center flex-1">
                    <ActivityIndicator size="large" color="#6769ef" />
                    <Text className="mt-3 text-sm text-gray-400 font-display">Loading orders…</Text>
                </View>
            ) : error ? (
                <View className="items-center justify-center flex-1 px-6">
                    <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
                    <Text className="mt-3 text-base text-center text-gray-700 font-display-semibold">{error}</Text>
                    <Pressable onPress={fetchOrders} className="px-6 py-3 mt-4 bg-primary rounded-xl">
                        <Text className="text-white font-display-semibold">Retry</Text>
                    </Pressable>
                </View>
            ) : visibleOrders.length === 0 ? (
                <View className="items-center justify-center flex-1 px-6">
                    <Ionicons name={tab === 'active' ? 'bag-outline' : 'time-outline'} size={48} color="#d1d5db" />
                    <Text className="mt-4 text-lg text-center text-gray-600 font-display-bold">
                        No {tab} {perspective} orders
                    </Text>
                    <Text className="mt-1 text-sm text-center text-gray-400 font-display">
                        {tab === 'active'
                            ? perspective === 'buying' ? 'Browse listings and place your first order.' : 'Orders from buyers will appear here.'
                            : 'Completed and cancelled orders will show here.'
                        }
                    </Text>
                </View>
            ) : (
                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                    {visibleOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            perspective={perspective}
                            onStatusUpdate={handleStatusUpdate}
                            updating={updating}
                        />
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default OrdersScreen;