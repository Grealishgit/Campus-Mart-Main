import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Listing, TransactionType } from '@/types';

interface ListingCardProps {
    listing: Listing;
    onClick: () => void;
    onFavoritePress?: () => void;
    isFavorited?: boolean;
    cardWidth?: number;
}

const ListingCard: React.FC<ListingCardProps> = ({
    listing,
    onClick,
    onFavoritePress,
    isFavorited = false,
    cardWidth,
}) => {
    const isLease = listing.type === TransactionType.LEASE;

    return (
        <Pressable
            onPress={onClick}
            className="overflow-hidden bg-white border border-gray-100 rounded-2xl active:opacity-75"
            style={{
                width: cardWidth,
                aspectRatio: 3 / 4,
                shadowColor: '#6769ef',
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

                {/* Gradient scrim — gives badges contrast on any image */}
                <View
                    className="absolute inset-0"
                    style={{
                        //   background: 'transparent',
                        // subtle top scrim
                        shadowColor: '#000',
                    }}
                />

                {/* Type badge */}
                <View
                    className="absolute top-2.5 left-2.5 flex-row items-center gap-1 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: isLease ? '#6769ef' : '#10b981' }}
                >
                    <Ionicons
                        name={isLease ? 'time-outline' : 'pricetag-outline'}
                        size={10}
                        color="white"
                    />
                    <Text className="text-[10px] tracking-widest text-white uppercase font-display-bold">
                        {isLease ? 'Lease' : 'Sale'}
                    </Text>
                </View>

                {/* Favourite button */}
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        onFavoritePress?.();
                    }}
                    hitSlop={8}
                    className="absolute top-2.5 right-2.5 items-center justify-center w-8 h-8 rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
                >
                    <Ionicons
                        name={isFavorited ? 'heart' : 'heart-outline'}
                        size={16}
                        color={isFavorited ? '#f43f5e' : 'white'}
                    />
                </Pressable>

                {/* Condition chip — only if present */}
                {listing.condition && (
                    <View
                        className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                        <Text className="text-[10px] text-white font-display-medium capitalize">
                            {listing.condition}
                        </Text>
                    </View>
                )}
            </View>

            {/* ── Content ───────────────────────────── */}
            <View className="gap-1 p-3" style={{ flex: 1 }}>
                <View className='flex-row items-center justify-between w-full'>
                    <Text
                        className="text-sm leading-tight text-gray-900 font-display-semibold"
                        numberOfLines={1}>
                        {listing.title.length > 15 ? listing.title.slice(0, 15) + '...' : listing.title}
                    </Text>
                    {/* Price */}
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-end justify-end  gap-0.5">

                            <Text className="text-gray-400 text-md font-display">Ksh</Text>
                            <Text className="text-base leading-none font-display-bold text-primary">
                                {listing.price.toLocaleString()}
                            </Text>
                            {isLease && listing.priceUnit && (
                                <Text className="text-3xl text-gray-400 font-display">{listing.priceUnit}</Text>
                            )}
                        </View>

                        {listing.isVerified && (
                            <MaterialIcons name="verified" size={14} color="#3b82f6" />
                        )}

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
                            className="flex-row items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full"
                        >
                            <Ionicons name={item.icon as any} size={10} color="#9ca3af" />
                            <Text className="text-[10px] text-gray-500 font-display-medium" numberOfLines={1}>
                                {item.value}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </Pressable>
    );
};

export default ListingCard;