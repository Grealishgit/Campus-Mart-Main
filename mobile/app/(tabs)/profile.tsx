import { View, Text, Image, ScrollView, Modal, ActivityIndicator, Alert, TextInput, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getMyListings } from '@/lib/listingService'
import { getUserProfile, logout, updateProfile, deleteAccount } from '@/lib/authService'
import { getFavorites } from '@/lib/favoriteService'
import profile from '../../assets/imgs/profile.jpeg'

// ─── Role helpers ─────────────────────────────────────────────
const ROLE_THEME = {
  student: { accent: '#6769ef', badge: 'Student' },
  vendor: { accent: '#f59e0b', badge: 'Vendor' },
} as const;

type Role = keyof typeof ROLE_THEME;
const getTheme = (role?: string) =>
  ROLE_THEME[(role as Role) ?? 'student'] ?? ROLE_THEME.student;

// Student tabs include Favorites; vendor tabs include Orders received
const getTabsForRole = (role?: string) => {
  if (role === 'vendor') {
    return [
      { label: 'My Listings', value: 'my listings' },
      { label: 'Orders', value: 'orders' },
      { label: 'Reviews', value: 'reviews' },
    ];
  }
  return [
    { label: 'My Listings', value: 'my listings' },
    { label: 'Favorites', value: 'favorites' },
    { label: 'Reviews', value: 'reviews' },
  ];
};



const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState<string>('my listings');
  const [editProfile, setEditProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  const theme = getTheme(userData?.role);
  const tabs = getTabsForRole(userData?.role);


  // buttons for other pages
  const nav_links = [
    {
      "name": 'My Listings',
      "icon": <Ionicons name="list" size={20} color={theme.accent} />,
      onPress: () => router.push('/my-listings' as any)
    },
    {
      "name": "My Orders",
      "icon": <Ionicons name="cart" size={20} color={theme.accent} />,
      onPress: () => router.push('/my-orders' as any)
    },
    {
      "name": "Favorites",
      "icon": <Ionicons name="heart" size={20} color={theme.accent} />,
      onPress: () => router.push('/favorites' as any)
    }
  ]

  // ─── Stats — different per role ───────────────────────────
  const listStats = userData
    ? userData.role === 'vendor'
      ? [
        { label: 'Active', val: String(userData.active_listings ?? 0) },
        { label: 'Sold', val: String(userData.total_sales ?? 0) },
        // { label: 'Rating', val: String(userData.rating?.toFixed(1) ?? '0'), icon: true },
      ]
      : [
        { label: 'Listings', val: String(userData.active_listings ?? 0) },
        { label: 'Orders', val: String(userData.orders_count ?? 0) },
        // { label: 'Rating', val: String(userData.rating?.toFixed(1) ?? '0'), icon: true },
      ]
    : [
      { label: 'Listings', val: '0' },
      { label: 'Orders', val: '0' },
      { label: 'Rating', val: '0', icon: true },
    ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileResult = await getUserProfile();
        if (profileResult.success && profileResult.data) {
          const data = (profileResult.data as any).user ?? profileResult.data;
          setUserData(data);
        }

        const listingsResult = await getMyListings() as any;
        if (listingsResult.success && listingsResult.data?.listings) {
          const listings = listingsResult.data.listings.map((item: any) => ({
            ...item,
            uniqueKey: `${item.type}-${item.id}`,
          }));
          setMyItems(listings);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeTab === 'favorites') {
      const fetchFavorites = async () => {
        try {
          const result = await getFavorites() as any;
          if (result.success && result.data?.favorites) {
            setFavorites(result.data.favorites);
          }
        } catch {
          Alert.alert('Error', 'Failed to load favorites');
        }
      };
      fetchFavorites();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login' as never);
    } catch {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // ─── Edit form — fields differ by role ────────────────────
  const [editFormData, setEditFormData] = useState({
    name: userData?.name || '',
    faculty: userData?.faculty || '',
    graduation_year: userData?.graduation_year?.toString() || '',
    location: userData?.location || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Keep form in sync when userData loads
  useEffect(() => {
    if (userData) {
      setEditFormData({
        name: userData.name || '',
        faculty: userData.faculty || '',
        graduation_year: userData.graduation_year?.toString() || '',
        location: userData.location || '',
      });
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    if (!editFormData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    try {
      setSavingProfile(true);
      const updateData =
        userData?.role === 'vendor'
          ? { name: editFormData.name, location: editFormData.location }
          : {
            name: editFormData.name,
            faculty: editFormData.faculty,
            graduation_year: editFormData.graduation_year
              ? parseInt(editFormData.graduation_year)
              : undefined,
          };

      const result = await updateProfile(updateData);
      if (result.success && result.data) {
        setUserData((result.data as any).user ?? result.data);
        setEditProfile(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', (result as any).message || 'Failed to update profile');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSavingProfile(true);
              const result = await deleteAccount();
              if (result.success) {
                await logout();
                router.replace('/(auth)/SignIn' as never);
              } else {
                Alert.alert('Error', (result as any).message || 'Failed to delete account');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            } finally {
              setSavingProfile(false);
            }
          },
        },
      ]
    );
  };

  // ─── Shared listing card ──────────────────────────────────
  const ListingCard = ({ item }: { item: any }) => (
    <Pressable
      className="flex-col w-[48%] gap-2"
      onPress={() => router.push(`/product-item/${item.id}`)}
    >
      <View className="relative overflow-hidden rounded-2xl aspect-square bg-slate-100">
        <Image source={{ uri: item.imageUrl }} className="object-cover w-full h-full" />
        <View className="absolute px-2 py-1 rounded-lg top-2 left-2 bg-white/90">
          <Text className="text-xs tracking-wide uppercase font-display-semibold">{item.category}</Text>
        </View>
      </View>
      <View className="px-1">
        <Text className="text-base leading-tight truncate font-display-bold">{item.title}</Text>
        <Text className="text-sm font-display-bold mt-0.5" style={{ color: theme.accent }}>
          Ksh {item.price?.toFixed(2)}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex flex-col h-full bg-white">

        {/* Header */}
        <View className="flex-row items-center justify-between p-4 pb-2 border-b border-gray-100">
          <Text className="flex-1 text-xl tracking-tight font-display-bold">Profile</Text>
          <Pressable
            onPress={() => router.push('/settings/settings')}
            className="items-center justify-center w-10 h-10 rounded-full"
          >
            <Ionicons name="settings-outline" size={25} color={theme.accent} />
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

          {/* Avatar + name */}
          <View className="items-center gap-4 p-4 pt-6">
            <View className="relative">
              <View className="overflow-hidden border-2 rounded-full shadow-lg border-primary size-28 ring-4 ring-white">
                {userData?.avatar_url
                  ? <Image source={{ uri: userData.avatar_url }} className="object-cover w-full h-full" />
                  : <View className='items-center justify-center w-full h-full bg-gray-200 ' >
                    <Ionicons name="camera" size={40} color="#9ca3af" />
                  </View>
                }
              </View>
              {userData?.is_verified && (
                <View className="absolute flex items-center justify-center border-2 border-white rounded-full w-7 h-7 bottom-1 right-1" style={{ backgroundColor: theme.accent }}>
                  <MaterialIcons name="verified" size={14} color="white" />
                </View>
              )}
            </View>

            <View className="items-center">
              <Text className="text-2xl tracking-tight font-display-bold">{userData?.name || 'Loading...'}</Text>
              <Text className="mt-0.5 text-sm text-gray-500 font-display-medium">{userData?.email}</Text>

              {/* Role badge */}
              <View className="px-3 py-1 mt-2 rounded-full" style={{ backgroundColor: theme.accent + '18' }}>
                <Text className="text-xs font-display-semibold" style={{ color: theme.accent }}>
                  {theme.badge}
                  {userData?.role === 'student' && userData?.faculty ? ` · ${userData.faculty}` : ''}
                  {userData?.role === 'vendor' && userData?.location ? ` · ${userData.location}` : ''}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setEditProfile(true)}
              className="w-full py-3 rounded-xl" style={{ backgroundColor: theme.accent }}>
              <Text className="text-lg text-center text-white font-display-semibold">
                Edit Profile
              </Text>
            </Pressable>
          </View>

          {/* Stats row */}
          <View className="flex-row justify-between gap-3 px-4 py-2">
            {listStats.map(stat => (
              <View key={stat.label} className="items-center flex-1 p-3 bg-white border border-gray-200 shadow-sm rounded-xl">
                <View className="flex-row items-center gap-1">
                  <Text className="text-2xl font-display-bold">{stat.val}</Text>
                  {stat.icon && <Ionicons name="star" size={14} color="#fbbf24" />}
                </View>
                <Text className="text-gray-500 text-[10px] uppercase tracking-wider font-display-semibold mt-1">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Tabs */}
          <View className="flex-row w-full px-4 mt-4 border-b border-gray-100">
            {tabs.map(tab => (
              <Pressable
                key={tab.value}
                onPress={() => setActiveTab(tab.value)}
                className={`flex-1 pb-3 border-b-2 ${tab.value === activeTab ? 'border-primary' : 'border-transparent'}`}
              >
                <Text
                  className={`text-center font-display-bold text-sm ${tab.value === activeTab ? 'text-primary' : 'text-gray-400'}`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab content */}
          {loading ? (
            <View className="items-center justify-center h-48">
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          ) : error ? (
            <View className="p-4">
              <Text className="text-center text-red-500 font-display-bold">{error}</Text>
            </View>
          ) : activeTab === 'my listings' ? (
                <View className="flex-row flex-wrap justify-between p-4 gap-y-4">
                  {myItems.length > 0
                    ? myItems.slice(0, 4).map((item, index) => (
                      <ListingCard key={item.uniqueKey ?? `listing-${index}`} item={item} />
                    ))
                    : <Text className="w-full pt-10 text-center text-gray-400 font-display">
                      No listings yet
                    </Text>
                  }
                  <Pressable className='items-end justify-end w-full mr-8 flex-end' onPress={() => router.push('/my-listings' as any)}>
                    <Text className='text-xl font-semibold underline text-primary'>View All</Text>
                  </Pressable>
            </View>
          ) : activeTab === 'favorites' ? (
                  <View className="flex-row flex-wrap justify-between p-4 gap-y-4">
                    {favorites.length > 0
                      ? favorites.map((item, index) => <ListingCard key={`favorite-${item.id ?? index}`} item={item} />)
                      : <Text className="w-full pt-10 text-center text-gray-400 font-display">No favorites yet</Text>
                    }
                  </View>
                ) : activeTab === 'orders' ? (
                  <View className="p-4">
                    <Text className="text-lg text-center text-gray-500 font-display-bold">📦 Orders Coming Soon</Text>
                    <Text className="mt-2 text-center text-gray-400 font-display">Track orders placed by buyers</Text>
            </View>
          ) : (
            <View className="p-4">
                        <Text className="text-lg text-center text-gray-500 font-display-bold">🌟 Reviews Coming Soon</Text>
                        <Text className="mt-2 text-center text-gray-400 font-display">View feedback from buyers and sellers</Text>
            </View>
          )}

          {/* Logout */}
          <View className="p-6 pb-32">
            <Pressable
              onPress={handleLogout}
              className="items-center justify-center w-full py-3 border border-red-400 rounded-xl bg-red-50"
            >
              <Text className="text-base text-red-500 font-display-bold">Logout</Text>
            </Pressable>
            <Text className="mt-4 text-xs tracking-widest text-center text-gray-400 uppercase font-display-bold">
              CampusMart v1.0.0
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* ─── Edit Profile Modal ─────────────────────────────── */}
      {editProfile && (
        <Modal onRequestClose={() => setEditProfile(false)} animationType="slide" transparent>
          <View className="justify-end flex-1 bg-black/40">
            <View className="w-full p-5 bg-white rounded-t-3xl max-h-[80%]">

              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-2xl font-display-bold">Edit Profile</Text>
                <Pressable onPress={() => setEditProfile(false)} disabled={savingProfile}>
                  <Ionicons name="close" size={24} color={theme.accent} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="gap-4 mb-4">

                {/* Name — both roles */}
                <View className="gap-1 mb-4">
                  <Text className="text-sm text-gray-600 font-display-semibold">Full Name</Text>
                  <TextInput
                    value={editFormData.name}
                    onChangeText={(t) => setEditFormData({ ...editFormData, name: t })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-display"
                    placeholder="Enter your name"
                    editable={!savingProfile}
                  />
                </View>

                {/* Email — read-only for both */}
                <View className="gap-1 mb-4">
                  <Text className="text-sm text-gray-600 font-display-semibold">Email</Text>
                  <TextInput
                    value={userData?.email}
                    className="w-full px-4 py-3 text-gray-400 border border-gray-200 rounded-xl font-display bg-gray-50"
                    editable={false}
                  />
                </View>

                {/* Student-only fields */}
                {userData?.role === 'student' && (
                  <>
                    <View className="gap-1 mb-4">
                      <Text className="text-sm text-gray-600 font-display-semibold">Faculty</Text>
                      <TextInput
                        value={editFormData.faculty}
                        onChangeText={(t) => setEditFormData({ ...editFormData, faculty: t })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-display"
                        placeholder="e.g. Engineering, Sciences"
                        editable={!savingProfile}
                      />
                    </View>
                    <View className="gap-1 mb-4">
                      <Text className="text-sm text-gray-600 font-display-semibold">Graduation Year</Text>
                      <TextInput
                        value={editFormData.graduation_year}
                        onChangeText={(t) => setEditFormData({ ...editFormData, graduation_year: t })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-display"
                        placeholder="2026"
                        keyboardType="numeric"
                        maxLength={4}
                        editable={!savingProfile}
                      />
                    </View>
                  </>
                )}

                {/* Vendor-only fields */}
                {userData?.role === 'vendor' && (
                  <View className="gap-1 mb-4">
                    <Text className="text-sm text-gray-600 font-display-semibold">Location</Text>
                    <TextInput
                      value={editFormData.location}
                      onChangeText={(t) => setEditFormData({ ...editFormData, location: t })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-display"
                      placeholder="e.g. Nairobi, Kenya"
                      editable={!savingProfile}
                    />
                  </View>
                )}

                <View className="gap-3 mt-2">
                  <Pressable
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                    className="items-center justify-center w-full py-3 rounded-xl"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {savingProfile
                      ? <ActivityIndicator color="white" />
                      : <Text className="text-base text-center text-white font-display-bold">Save Changes</Text>
                    }
                  </Pressable>

                  <Pressable
                    onPress={handleDeleteAccount}
                    disabled={savingProfile}
                    className="items-center justify-center w-full py-3 bg-red-500 rounded-xl"
                  >
                    <Text className="text-base text-center text-white font-display-bold">Delete Account</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default ProfileScreen;