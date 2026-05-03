import {
    View, Text, Pressable, Image, ScrollView,
    ActivityIndicator, Alert, Platform,
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addFavorite, removeFavorite, isFavorited } from '@/lib/favoriteService'
import { createConversation } from '@/lib/chatService'
import { createOrder } from '@/lib/orderService'
import { getCurrentUser } from '@/lib/authService'

// ─── helpers ─────────────────────────────────────────────────
const fmt = (date: Date) => date.toISOString().split('T')[0];
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

const ProductItemScreen = () => {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // lease date state
    const [leaseStart, setLeaseStart] = useState('');
    const [leaseEnd, setLeaseEnd] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const {
        id, title, price, priceUnit, type,
        category, condition, location, imageUrl,
        description, sellerName, sellerRating,
        sellerAvatar, sellerVerified, sellerId, sellerRole,
        minDuration, maxDuration, durationUnit,
        availableFrom, availableUntil,
    } = useLocalSearchParams<{
        id: string; title: string; price: string;
        priceUnit: string; type: string; category: string;
        condition: string; location: string; imageUrl: string;
        description: string; sellerName: string; sellerRating: string;
        sellerAvatar: string; sellerVerified: string; sellerId: string; sellerRole?: string;
        minDuration: string; maxDuration: string; durationUnit: string;
        availableFrom: string; availableUntil: string;
    }>();

    const isOwner = currentUserId && sellerId && currentUserId === sellerId;
    const isVendorSeller = String(sellerRole || 'student').toLowerCase() === 'vendor';
    const themeColor = isVendorSeller ? '#f59e0b' : '#6769ef';
    const themeSoft = isVendorSeller ? '#f59e0b18' : '#6769ef18';
    const sellerLabel = isVendorSeller ? 'Vendor' : 'Student';
    // console.log('current logged in user', currentUserId);
    // console.log("product seller", sellerId)

    useEffect(() => {
        const init = async () => {
            if (id) setIsFav(await isFavorited(id));
            const me = await getCurrentUser();
            const user = (me.data as any)?.user ?? me.data;
            if (user?.id) setCurrentUserId(String(user.id));
        };
        init();
    }, [id]);

    const handleLikeProduct = async () => {
        try {
            setLoading(true);
            if (isFav) {
                const result = await removeFavorite(id, type as 'SALE' | 'LEASE');
                // console.log('remove result:', result);
                if (result.success) setIsFav(false);   
            } else {
                const result = await addFavorite(id, type as 'SALE' | 'LEASE');
                // console.log('add result:', result);
                if (result.success) setIsFav(true);   
            }
        } catch (err: any) {
            console.error('favorite error:', err);
            Alert.alert('Error', 'Failed to update favorites');
        } finally {
            setLoading(false);
        }
    };

    const handleMessageSeller = async () => {
        try {
      const result = await createConversation(id, type as 'SALE' | 'LEASE');
      const conversation = result.data?.conversation;
      if (result.success && conversation?.id) {
        router.push({
            pathname: '/chats/chat',
            params: {
                id: String(conversation.id),
                name: sellerName ?? 'Seller',
                avatarUrl: sellerAvatar ?? '',           
                isOnline: 'false',
                listingThumb: imageUrl ?? '',
                listingTitle: title ?? '',             
                type: conversation.type ?? 'BUYING',
                lastMessage: '',
                timestamp: conversation.created_at ?? '',
                unreadCount: '0',
            },
        } as never);
    } else {
        Alert.alert('Error', result.error || 'Failed to start conversation');
    }
       } catch (err: any) {
           Alert.alert('Error', err.message || 'Failed to start conversation');
       }
   };

    const handleBuyNow = async () => {
        try {
            setLoading(true);
            if (type === 'LEASE' && (!leaseStart || !leaseEnd)) {
                Alert.alert('Select dates', 'Please pick both lease start and end dates.');
                return;
            }

            const result = await createOrder({
                listingId: id,
                type: type as 'SALE' | 'LEASE',
                leaseStart: type === 'LEASE' ? leaseStart : undefined,
                leaseEnd: type === 'LEASE' ? leaseEnd : undefined,
            });

            if (result.success && result.data?.order?.id) {
                Alert.alert(
                    'Success',
                    type === 'LEASE' ? 'Lease created successfully.' : 'Order placed successfully.',
                    [
                        { text: type === 'LEASE' ? 'View Leases' : 'View Orders', onPress: () => router.push('/(tabs)/orders') },
                        { text: 'Continue Shopping', onPress: () => router.back() },
                    ]
                );
            } else {
                Alert.alert('Error', result.error || (result as any).message || 'Failed to create order');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSellerStore = async () => {
        if (!sellerId || isOwner) return;

        if (!isVendorSeller) {
            Alert.alert('Student seller', 'This seller does not have a store page.');
            return;
        }

        router.push({
            pathname: '/vendor/store',
            params: {
                sellerId: String(sellerId),
                sellerName: sellerName ?? 'Vendor',
                sellerAvatar: sellerAvatar ?? '',
                sellerRole: sellerRole ?? 'vendor',
                sellerRating: String(sellerRating ?? 0),
                sellerVerified: String(sellerVerified ?? false),
                sellerLocation: location ?? '',
            },
        });
    };

    // ─── detail pills ─────────────────────────────────────────
    const details = [
        { icon: <Feather name="box" size={20} color="#6769ef" />, label: 'Condition', value: condition },
        { icon: <Ionicons name="location-outline" size={20} color="#6769ef" />, label: 'Pickup', value: location },
        { icon: <MaterialCommunityIcons name="tag-outline" size={20} color="#6769ef" />, label: 'Category', value: category },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* ── Floating header ────────────────────────────────── */}
            <View className="absolute z-50 flex-row items-center justify-between w-full px-4 py-3 top-8">
                <Pressable
                    onPress={() => router.back()}
                    className="items-center justify-center bg-white rounded-full shadow-sm w-11 h-11 active:bg-gray-50"
                >
                    <Ionicons name="chevron-back" size={22} color={themeColor} />
                </Pressable>

                <View className="flex-row items-center gap-2">
                    {isOwner ? (
                        <Pressable
                            onPress={() => router.push({
                                pathname: '/edit-listing',
                                params: {
                                    id,
                                    type,
                                    title,
                                    description,
                                    price: String(price),
                                    priceUnit: priceUnit ?? '',
                                    category,
                                    condition,
                                    location,
                                    imageUrl: imageUrl ?? '',
                                    minDuration: String(minDuration ?? ''),
                                    maxDuration: String(maxDuration ?? ''),
                                    durationUnit: durationUnit ?? 'days',
                                    availableFrom: availableFrom ?? '',
                                    availableUntil: availableUntil ?? '',
                                },
                            })}
                            className="flex-row items-center gap-1.5 px-4 py-2 rounded-full shadow-sm"
                            style={{ backgroundColor: themeColor }}
                        >
                            <Ionicons name="create-outline" size={16} color="white" />
                            <Text className="text-sm text-white font-display-semibold">Edit</Text>
                        </Pressable>
                    ) : (
                        <>
                            <Pressable
                                onPress={() => { }}
                                className="items-center justify-center bg-white rounded-full shadow-sm w-11 h-11 active:bg-gray-50"
                            >
                                    <Ionicons name="share-social-outline" size={20} color={themeColor} />
                            </Pressable>
                            <Pressable
                                onPress={handleLikeProduct}
                                disabled={loading}
                                    className="items-center justify-center bg-white rounded-full shadow-sm w-11 h-11 active:bg-gray-50"
                                >
                                    {loading
                                        ? <ActivityIndicator color={themeColor} size="small" />
                                        : <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? '#f43f5e' : themeColor} />
                                    }
                                </Pressable>
                        </>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* ── Hero image ──────────────────────────────────── */}
                <View className="relative">
                    <Image
                        source={{ uri: imageUrl || 'https://via.placeholder.com/400x450' }}
                        className="w-full"
                        style={{ height: 420 }}
                        resizeMode="cover"
                    />
                    {/* Type badge */}
                    <View
                        className="absolute px-3 py-1.5 rounded-full bottom-4 left-4"
                        style={{ backgroundColor: type === 'LEASE' ? themeColor : '#10b981' }}
                    >
                        <Text className="text-xs tracking-widest text-white uppercase font-display-bold">
                            {type === 'LEASE' ? 'Lease' : 'For Sale'}
                        </Text>
                    </View>
                </View>

                <View className="px-4 pt-5">

                    {/* ── Title + price ───────────────────────────── */}
                    <Text className="text-3xl leading-tight text-gray-900 font-display-bold" numberOfLines={2}>
                        {title}
                    </Text>

                    <View className="flex-row items-baseline gap-1.5 mt-2">
                        <Text className="text-xs text-gray-400 font-display">Ksh</Text>
                        <Text className="text-3xl font-display-bold" style={{ color: themeColor }}>
                            {Number(price).toLocaleString()}
                        </Text>
                        {type === 'LEASE' && priceUnit && (
                            <Text className="text-sm text-gray-400 font-display">{priceUnit}</Text>
                        )}
                        {type === 'SALE' && (
                            <Text className="text-sm text-gray-400 font-display">· Final price</Text>
                        )}
                    </View>

                    {/* ── Detail pills ────────────────────────────── */}
                    <View className="flex-row flex-wrap gap-2 mt-4">
                        {details.map(d => (
                            <View
                                key={d.label}
                                className="flex-row items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full"
                            >
                                {React.cloneElement(d.icon, { color: themeColor })}
                                <Text className="text-xs text-gray-500 font-display-medium">{d.label}: </Text>
                                <Text className="text-xs text-gray-800 font-display-semibold">{d.value}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Seller card ─────────────────────────────── */}
                    <Pressable
                        onPress={handleOpenSellerStore}
                        disabled={!sellerId || !!isOwner || !isVendorSeller}
                        className="flex-row items-center gap-3 p-4 mt-5 border border-gray-100 bg-gray-50 rounded-2xl"
                    >
                        {sellerAvatar ? (
                            <Image source={{ uri: sellerAvatar }} className="w-12 h-12 rounded-full" />
                        ) : (
                            <View className="items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                                    <Ionicons name="person" size={22} color={themeColor} />
                            </View>
                        )}

                        <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                                <Text className="text-base text-gray-900 font-display-semibold">
                                    {isOwner ? 'Posted by you' : sellerName}
                                </Text>
                                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: themeSoft }}>
                                    <Text className="text-[10px] font-display-bold uppercase" style={{ color: themeColor }}>
                                        {sellerLabel}
                                    </Text>
                                </View>
                                {sellerVerified === 'true' && (
                                    <MaterialIcons name="verified" size={15} color="#3b82f6" />
                                )}
                            </View>
                            <Text className="text-xs mt-0.5 font-display" style={{ color: sellerVerified === 'true' ? themeColor : '#9ca3af' }}>
                                {isOwner ? 'You can edit this listing' : sellerVerified === 'true' ? 'Verified Seller' : 'Unverified Seller'}
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl" style={{ backgroundColor: themeSoft, borderWidth: 1, borderColor: themeColor + '22' }}>
                            <Ionicons name="star" size={13} color={themeColor} />
                            <Text className="text-sm font-display-semibold" style={{ color: themeColor }}>{sellerRating}</Text>
                        </View>
                    </Pressable>

                    {/* ── Description ─────────────────────────────── */}
                    <View className="mt-5">
                        <Text className="mb-2 text-base text-gray-900 font-display-bold">About this item</Text>
                        <Text className="text-base leading-relaxed text-gray-500 font-display">{description}</Text>
                    </View>

                    {/* ── Lease date pickers ───────────────────────── */}
                    {type === 'LEASE' && !isOwner && (
                        <View className="p-4 mt-6 border bg-primary/5 border-primary/20 rounded-2xl">
                            <Text className="mb-1 text-base text-gray-900 font-display-bold">Select Lease Dates</Text>
                            <Text className="mb-4 text-xs text-gray-500 font-display">
                                Rate: Ksh {Number(price).toLocaleString()}{priceUnit || ''}
                            </Text>

                            {/* Start date */}
                            <Pressable
                                onPress={() => setShowStartPicker(true)}
                                className="flex-row items-center gap-3 px-4 py-3 mb-3 bg-white border border-gray-200 rounded-xl"
                            >
                                <Ionicons name="calendar-outline" size={18} color="#6769ef" />
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-400 font-display">Start date</Text>
                                    <Text className={`text-sm font-display-semibold ${leaseStart ? 'text-gray-900' : 'text-gray-300'}`}>
                                        {leaseStart || 'Tap to select'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                            </Pressable>

                            {showStartPicker && (
                                <DateTimePicker
                                    value={leaseStart ? new Date(leaseStart) : today()}
                                    mode="date"
                                    minimumDate={today()}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, date) => {
                                        if (Platform.OS === 'android') setShowStartPicker(false);
                                        if (event.type === 'dismissed') { setShowStartPicker(false); return; }
                                        if (date) { setLeaseStart(fmt(date)); setLeaseEnd(''); }
                                        if (Platform.OS === 'ios') setShowStartPicker(false);
                                    }}
                                />
                            )}

                            {/* End date */}
                            <Pressable
                                onPress={() => { if (!leaseStart) { Alert.alert('Pick start date first'); return; } setShowEndPicker(true); }}
                                className="flex-row items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl"
                            >
                                <Ionicons name="calendar-outline" size={18} color="#6769ef" />
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-400 font-display">End date</Text>
                                    <Text className={`text-sm font-display-semibold ${leaseEnd ? 'text-gray-900' : 'text-gray-300'}`}>
                                        {leaseEnd || 'Tap to select'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                            </Pressable>

                            {showEndPicker && (
                                <DateTimePicker
                                    value={leaseEnd ? new Date(leaseEnd) : (leaseStart ? new Date(leaseStart) : today())}
                                    mode="date"
                                    minimumDate={leaseStart ? new Date(leaseStart) : today()}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, date) => {
                                        if (Platform.OS === 'android') setShowEndPicker(false);
                                        if (event.type === 'dismissed') { setShowEndPicker(false); return; }
                                        if (date) setLeaseEnd(fmt(date));
                                        if (Platform.OS === 'ios') setShowEndPicker(false);
                                    }}
                                />
                            )}

                            {/* Duration summary */}
                            {leaseStart && leaseEnd && (
                                <View className="flex-row items-center gap-2 px-3 py-2 mt-3 bg-primary/10 rounded-xl">
                                    <Ionicons name="time-outline" size={14} color="#6769ef" />
                                    <Text className="text-xs text-primary font-display-semibold">
                                        {Math.ceil((new Date(leaseEnd).getTime() - new Date(leaseStart).getTime()) / 86400000)} day(s) ·{' '}
                                        Est. Ksh {(Math.ceil((new Date(leaseEnd).getTime() - new Date(leaseStart).getTime()) / 86400000) * Number(price)).toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Owner-only actions */}
                    {isOwner && (
                        <View className="flex-row gap-3 mt-6">
                            <Pressable
                                onPress={() => router.push({
                                    pathname: '/edit-listing',
                                    params: {
                                        id,
                                        type,
                                        title,
                                        description,
                                        price: String(price),
                                        priceUnit: priceUnit ?? '',
                                        category,
                                        condition,
                                        location,
                                        imageUrl: imageUrl ?? '',
                                        minDuration: String(minDuration ?? ''),
                                        maxDuration: String(maxDuration ?? ''),
                                        durationUnit: durationUnit ?? 'days',
                                        availableFrom: availableFrom ?? '',
                                        availableUntil: availableUntil ?? '',
                                    },
                                })}
                                className="flex-row items-center justify-center flex-1 gap-2 py-3 rounded-xl"
                                style={{ borderWidth: 1, borderColor: themeColor }}
                            >
                                <Ionicons name="create-outline" size={18} color={themeColor} />
                                <Text className="text-base font-display-semibold" style={{ color: themeColor }}>Edit Listing</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => Alert.alert('Delete', 'Delete this listing?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Delete', style: 'destructive', onPress: () => router.back() },
                                ])}
                                className="flex-row items-center justify-center flex-1 gap-2 py-3 border border-red-200 bg-red-50 rounded-xl"
                            >
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                <Text className="text-base text-red-500 font-display-semibold">Delete</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* ── Bottom bar — hidden for owner ───────────────────── */}
            {!isOwner && (
                <View
                    className="absolute bottom-0 left-0 right-0 flex-row gap-3 px-4 py-3 bg-white border-t border-gray-100"
                    style={{ paddingBottom: 20 }}
                >
                    <Pressable
                        onPress={handleMessageSeller}
                        className="items-center justify-center border w-14 h-14 rounded-2xl"
                        style={{ borderColor: themeColor }}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color={themeColor} />
                    </Pressable>

                    <Pressable
                        onPress={handleBuyNow}
                        disabled={loading}
                        className="items-center justify-center flex-1 py-4 rounded-2xl bg-primary active:opacity-80"
                    >
                        {loading
                            ? <ActivityIndicator color="white" />
                            : (
                                <View className="flex-row items-center gap-2">
                                    <Ionicons
                                        name={type === 'LEASE' ? 'time-outline' : 'bag-check-outline'}
                                        size={18}
                                        color="white"
                                    />
                                    <Text className="text-base text-white font-display-bold">
                                        {type === 'LEASE' ? 'Rent Now' : 'Buy Now'}
                                    </Text>
                                </View>
                            )
                        }
                    </Pressable>
                </View>
            )}
        </SafeAreaView>
    );
};

export default ProductItemScreen;