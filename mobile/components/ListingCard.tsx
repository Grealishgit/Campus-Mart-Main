import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Listing, TransactionType } from '@/types';
import { getCurrentUser } from '@/lib/authService'
import {
    addFavorite,
    removeFavorite,
    isFavorited as checkIsFavorited
} from '@/lib/favoriteService';
// const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

interface ListingCardProps {
    listing: Listing;
    onClick: () => void;
    onFavoritePress?: () => void;
    isFavorited?: boolean;
    cardWidth?: number;
    userId?: string | null;
}

const ListingCard: React.FC<ListingCardProps> = ({
    listing,
    onClick,
    onFavoritePress,
    isFavorited = false,
    cardWidth,
    userId,
}) => {
    const isLease = listing.type === TransactionType.LEASE;
    const sellerRole = (listing as any)?.seller?.role ?? (listing as any)?.seller_role ?? (listing as any)?.sellerRole ?? 'student';
    const isVendor = String(sellerRole).toLowerCase() === 'vendor';
    const accentColor = isVendor ? '#f59e0b' : '#6769ef';
    const accentSoft = isVendor ? '#f59e0b18' : '#6769ef18';

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const sellerId = (listing as any).userId;
    const isOwner = !!(currentUserId && sellerId && currentUserId === sellerId);


    const handleFavoritePress = onFavoritePress ?? (async () => {
        try {
            if (localFavorited) {
                await removeFavorite(listing.id, listing.type as 'SALE' | 'LEASE');
                setLocalFavorited(false);
            } else {
                await addFavorite(listing.id, listing.type as 'SALE' | 'LEASE');
                setLocalFavorited(true);
            }
        } catch {
            // revert on failure
            setLocalFavorited(prev => !prev);
        }
    });

    const [localFavorited, setLocalFavorited] = useState(isFavorited);

    // useEffect(() => {
    //     setLocalFavorited(isFavorited);
    // }, [isFavorited]);

    

    useEffect(() => {
        const init = async () => {
            const me = await getCurrentUser();
            const user = (me.data as any)?.user ?? me.data;
            if (user?.id) setCurrentUserId(String(user.id));
        };
        init();
    }, []);

    return (
        <Pressable
            onPress={onClick}
            className="overflow-hidden bg-white border border-gray-100 rounded-2xl active:opacity-75"
            style={{
                width: cardWidth,
                aspectRatio: 3 / 4,
                shadowColor: '#6769ef',
                backgroundColor: isOwner ? '#6769ef' : '#ffffff',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
            }}
        >
            {/* ── Image ─────────────────────────────── */}
            <View className="relative w-full bg-gray-100" style={{ flex: 2 }}>
                <Image
                    source={{ uri: listing.imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                />

                {isOwner && (
                    <View className="absolute mt-20 left-[30%] justify-center bg-primary items-center gap-1 px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}>
                        <Text className='text-sm font-semibold text-primary'>Owned by You</Text>
                    </View>
                )}

                {/* Gradient scrim — gives badges contrast on any image */}
                <View
                    className="absolute inset-0"
                    style={{
                        //   background: 'transparent',
                        // subtle top scrim
                        shadowColor: '#000',
                    }}
                />

                <View className='flex-row absolute top-2.5 left-2.5 items-center'>
                    {listing.condition && (
                        <View className="">
                            {listing.isVerified && (
                                <MaterialIcons name="verified" size={16} color="#3b82f6" />
                            )}
                        </View>
                    )}
                    <View
                        className=" flex-row items-center gap-1 px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: isLease ? accentColor : '#10b981' }}
                    >

                        <Ionicons
                            name={isLease ? 'time-outline' : 'pricetag-outline'}
                            size={10}
                            color="white"
                        />
                        <Text className="text-xs tracking-widest text-white font-display-bold">
                            {isLease ? 'Lease' : 'Sale'}
                        </Text>
                    </View>
                </View>


                {/* Favourite button */}
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        handleFavoritePress();
                    }}

                    hitSlop={8}
                    className="absolute top-2.5 right-2.5 items-center justify-center w-8 h-8 rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>

                    <Ionicons
                        name={localFavorited ? 'heart' : 'heart-outline'}
                        size={16}
                        color={localFavorited ? '#f43f5e' : 'white'}
                    />
                </Pressable>
                <View className="ml-1 px-2 absolute bottom-1 py-0.5 rounded-full" style={{ backgroundColor: accentSoft }}>
                    <Text className="text-[10px] font-display-bold uppercase" style={{ color: accentColor }}>
                        {isVendor ? 'Vendor' : 'Student'}
                    </Text>
                </View>

            </View >

            {/* ── Content ───────────────────────────── */}
            <View className="gap-1 p-3" style={{ flex: 1 }}>
                <View className='flex-row items-center justify-between w-full'>
                    <Text
                        className="text-sm leading-tight font-display-semibold"
                        style={{ color: isOwner ? '#ffffff' : '#111827' }}
                        numberOfLines={1}
                    >
                        {listing.title.length > 15 ? listing.title.slice(0, 15) + '...' : listing.title}
                    </Text>

                    {/* Price */}
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-end justify-end  gap-0.5">
                            <View>
                                <Text style={{ color: isOwner ? '#c7d2fe' : '#9ca3af' }} className="text-md font-display">Ksh</Text>
                                <Text style={{ color: isOwner ? '#ffffff' : accentColor }} className="text-base leading-none font-display-bold">
                                    {listing.price.toLocaleString()}
                                </Text>
                            </View>

                            {isLease && listing.priceUnit && (
                                <Text className="text-sm text-gray-400 font-display">{listing.priceUnit}</Text>
                            )}
                        </View>



                    </View>
                </View>


                {/* Meta pills */}
                <View className="flex-row flex-wrap gap-1 mt-1">
                    {[
                        { icon: 'location-outline', value: listing.location },
                        { icon: 'grid-outline', value: listing.category },
                        { icon: 'sparkles-outline', value: listing.condition },
                    ].filter(item => item.value).map((item) => (
                        <View
                            key={item.icon}
                            className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: isOwner ? 'rgba(255,255,255,0.2)' : '#f3f4f6' }}
                        >
                            <Ionicons name={item.icon as any} size={10} color={isOwner ? '#c7d2fe' : accentColor} />
                            <Text
                                className="text-[10px] font-display-medium"
                                style={{ color: isOwner ? '#e0e7ff' : accentColor }}
                                numberOfLines={1}
                            >
                                {item.value}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </Pressable >
    );
};

export default ListingCard;