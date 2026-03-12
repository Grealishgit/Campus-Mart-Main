import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Listing, TransactionType } from '@/types';

interface ListingCardProps {
    listing: Listing;
    onClick: () => void;
    onFavoritePress?: () => void;
    cardWidth?: number;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, onFavoritePress, cardWidth }) => {
    return (
        <Pressable
            onPress={onClick}
            className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl active:opacity-80"
            style={{
                width: cardWidth,
                aspectRatio: 3 / 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
            }}
        >
            {/* Image Container */}
            <View className="relative w-full bg-gray-200" style={{ flex: 3 }}>
                <Image
                    source={{ uri: listing.imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                />

                {/* Type Badge */}
                <View className={`absolute top-2 left-2 px-2 py-1 rounded-full ${listing.type === TransactionType.SALE ? 'bg-green-500' : 'bg-primary'
                    }`}>
                    <Text className="text-xs tracking-wider text-white uppercase font-display-bold">
                        {listing.type === TransactionType.SALE ? 'SALE' : 'LEASE'}
                    </Text>
                </View>

                {/* Favorite Button */}
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        onFavoritePress?.();
                    }}
                    className="absolute p-2 rounded-full top-2 right-2 bg-white/20 backdrop-blur-md"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                    <Ionicons name="heart-outline" size={18} color="white" />
                </Pressable>
            </View>

            {/* Content */}
            <View className="p-3" style={{ flex: 1 }}>
                {/* Price Row */}
                <View className="flex-row items-center gap-1 mb-1">
                    <Text className="text-lg font-display-bold text-primary">
                        Ksh {listing.price}{listing.priceUnit}
                    </Text>
                    {listing.isVerified && (
                        <MaterialIcons name="verified" size={14} color="#3b82f6" />
                    )}
                </View>

                {/* Title */}
                <Text
                    className="text-sm text-gray-900 font-display-semibold"
                    numberOfLines={1}
                >
                    {listing.title}
                </Text>

                {/* Location */}
                <View className="flex-row items-center gap-1 mt-1">
                    <Ionicons name="location-outline" size={12} color="#6b7280" />
                    <Text className="text-xs text-gray-500 font-display" numberOfLines={1}>
                        {listing.location} • {listing.distance}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

export default ListingCard;