import { View, Text, Image, ScrollView, Modal, ActivityIndicator, Alert, TextInput, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getUserProfile, logout, updateProfile, deleteAccount } from '@/lib/authService'
import * as ImagePicker from 'expo-image-picker';

import {
  getMyOrders, getSellingOrders
} from '@/lib/orderService';

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
  const [editProfile, setEditProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [sellingOrders, setSellingOrders] = useState(0);

  const [editImageUri, setEditImageUri] = useState<string | null>(userData?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    getMyOrders().then(res => setOrderCount(res.data?.orders?.length ?? 0));
    getSellingOrders().then(res => setSellingOrders(res.data?.orders?.length ?? 0));
  }, []);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setEditImageUri(result.assets[0].uri);
  };

  const theme = getTheme(userData?.role);
  const tabs = getTabsForRole(userData?.role);


  // buttons for other pages
  const nav_links = [
    {
      section: 'My Activity',
      items: [
        {
          name: 'Create Listings',
          icon: 'arrow-up-right-box-outline',
          onPress: () => router.push('/(listing)/create-listing' as any)
        },
        {
          name: 'My Listings',
          icon: 'albums-outline',
          onPress: () => router.push('/(listing)/my-listings' as any)
        },
        { 
          name: 'My Orders',
          icon: 'bag-handle-outline',
          onPress: () => router.push('/orders' as any)
        },
        { 
          name: 'Favorites',
          icon: 'heart-outline',
          onPress: () => router.push('/(listing)/favorites' as any)
        },
        {
          name: 'My Leases',
          icon: 'time-outline',
          onPress: () => router.push('/(tabs)/leases' as any)
        },
      ],
    },
    {
      section: 'Account',
      items: [
        {
          name: 'Edit Profile',
          icon: 'create-outline',
          onPress: () => setEditProfile(true)
        },
        {
          name: 'Change Password',
          icon: 'key-outline',
          onPress: () => router.push('/settings/change-password' as any)
        },
        {
          name: 'Notifications',
          icon: 'notifications-outline',
          onPress: () => router.push('/settings/notifications' as any)
        },
      ],
    },
    {
      section: 'Support & Legal',
      items: [
        { name: 'Help Center', icon: 'help-circle-outline', onPress: () => router.push('/settings/help' as any) },
        { name: 'Privacy Policy', icon: 'shield-outline', onPress: () => router.push('/settings/privacy' as any) },
        { name: 'Terms of Service', icon: 'document-text-outline', onPress: () => router.push('/settings/terms' as any) },
        { name: 'Report a Bug', icon: 'bug-outline', onPress: () => router.push('/settings/report' as any) },
      ],
    },
  ] as const;

  // ─── Stats — different per role ───────────────────────────
  const listStats = userData
    ? userData.role === 'vendor'
      ? [
        { label: 'Active', val: String(userData.active_listings ?? 0) },
        { label: 'Sold', val: String(userData.total_sales ?? 0) },
      ]
      : [
        { label: 'Listings', val: String(userData?.active_listings ?? 0) },
        { label: 'Orders', val: String(orderCount) },
        { label: 'Selling Orders', val: String(sellingOrders) },
      ]
    : [
      { label: 'Listings', val: '0' },
      { label: 'Orders', val: '0' },
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

      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);


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
    location: userData?.location || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Keep form in sync when userData loads
  useEffect(() => {
    if (userData) {
      setEditFormData({
        name: userData.name || '',
        faculty: userData.faculty || '',
        location: userData.location || '',
      });
    }
  }, [userData]);

  const handleSaveProfile = async () => {
    if (!editFormData.name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    try {
      setSavingProfile(true);

      // If new image picked, upload via multipart
      if (editImageUri && editImageUri !== userData?.avatar_url) {
        const body = new FormData();
        body.append('name', editFormData.name);
        if (userData?.role === 'vendor') body.append('location', editFormData.location);
        if (userData?.role === 'student') body.append('faculty', editFormData.faculty);

        const filename = editImageUri.split('/').pop() ?? 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1].replace('jpg', 'jpeg')}` : 'image/jpeg';
        body.append('avatar', { uri: editImageUri, name: filename, type: mimeType } as any);

        const { getAuthToken } = await import('@/lib/apiClient');
        const token = await getAuthToken();
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/profile`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
          body,
        });
        const data = await response.json();
        if (data.success) {
          setUserData((data as any).user ?? data);
          setEditProfile(false);
          Alert.alert('Success', 'Profile updated successfully');
        } else {
          Alert.alert('Error', data.message || 'Failed to update profile');
        }
        return;
      }

      // No new image — use existing service
      const updateData = userData?.role === 'vendor'
        ? { name: editFormData.name, location: editFormData.location }
        : { name: editFormData.name, faculty: editFormData.faculty };

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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex flex-col h-full bg-white">

        {/* Header */}
        <View className="flex-row items-center justify-between p-4 pb-2 border-b border-gray-100">
          <Text className="flex-1 text-xl tracking-tight font-display-bold">Profile</Text>
          <Pressable
            onPress={handleLogout}
            className="items-center justify-center w-10 h-10 rounded-full"
          >
            <MaterialIcons name="logout" size={25} color={theme.accent} />
          </Pressable>
        </View>

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

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Stats row */}
          <View className="flex-row justify-between gap-3 px-4 py-2">
            {listStats.map(stat => (
              <View key={stat.label} className="items-center flex-1 p-3 bg-white border border-gray-200 shadow-sm rounded-xl">
                <View className="flex-row items-center gap-1">
                  <Text className="text-2xl font-display-bold">{stat.val}</Text>
                </View>
                <Text className="text-gray-500 text-[10px] uppercase tracking-wider font-display-semibold mt-1">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>


          {/* Nav links */}
          <View className="gap-4 px-4 mt-4">
            {nav_links.map(section => (
              <View key={section.section}>
                <Text className="mb-2 ml-1 text-xs tracking-widest text-gray-400 uppercase font-display-semibold">
                  {section.section}
                </Text>
                <View className="overflow-hidden bg-white border border-gray-100 rounded-2xl"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
                >
                  {section.items.map((item, i) => (
                    <Pressable
                      key={item.name}
                      onPress={item.onPress}
                      className={`flex-row items-center px-4 py-3.5 active:bg-gray-50 ${i < section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <View className="items-center justify-center mr-3 w-9 h-9 rounded-xl" style={{ backgroundColor: theme.accent + '15' }}>
                        <Ionicons name={item.icon as any} size={18} color={theme.accent} />
                      </View>
                      <Text className="flex-1 text-base text-gray-800 font-display-medium">{item.name}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Logout */}
          <View className="p-6 pb-32">
            <Pressable
              onPress={handleLogout}
              className="items-center justify-center w-full py-3 border border-red-400 rounded-xl bg-red-50"
            >
              <Text className="text-base text-red-500 font-display-bold">Logout</Text>
            </Pressable>

            <View className='flex flex-col w-full p-2 mt-8 bg-white shadow-lg rounded-xl'>
              <View className='flex-row items-center gap-2 mb-4 ml-5'>
                <MaterialCommunityIcons name="delete" size={24} color="red" />
                <Text className='text-xl font-semibold text-gray-500 '>
                  Danger Zone
                </Text>
              </View>

              <Pressable
                onPress={handleDeleteAccount}
                className="items-center justify-center w-full py-3 mt-3 bg-red-500 rounded-xl"
              >
                <Text className="text-base text-center text-white font-display-bold">Delete Account</Text>
              </Pressable>
            </View>

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

                {/* Avatar picker */}
                <Pressable onPress={handlePickAvatar} className="items-center mb-5">
                  <View className="relative">
                    <View className="overflow-hidden border-2 rounded-full size-20"
                      style={{ borderColor: theme.accent }}>
                      {editImageUri
                        ? <Image source={{ uri: editImageUri }} className="w-full h-full" resizeMode="cover" />
                        : <View className="items-center justify-center w-full h-full bg-gray-100">
                          <Ionicons name="person" size={32} color="#9ca3af" />
                        </View>
                      }
                    </View>
                    <View className="absolute bottom-0 right-0 items-center justify-center w-6 h-6 border-2 border-white rounded-full" style={{ backgroundColor: theme.accent }}>
                      <Ionicons name="camera" size={12} color="white" />
                    </View>
                  </View>
                  <Text className="mt-2 text-sm font-display-medium" style={{ color: theme.accent }}>
                    Change Photo
                  </Text>
                </Pressable>

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

                <View className="flex-row items-center flex-1 gap-4 mt-2">

                  <Pressable
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                    className="items-center justify-center flex-1 py-3 rounded-xl"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {savingProfile
                      ? <ActivityIndicator color="white" />
                      : <Text className="text-lg text-center text-white font-display-bold">
                        Save Changes
                      </Text>
                    }
                  </Pressable>
                  <Pressable
                    onPress={() => setEditProfile(false)}
                    disabled={savingProfile}
                    className="items-center justify-center flex-1 py-3 bg-gray-400 rounded-xl"
                  >
                    <Text className="text-lg text-center text-white font-display-bold">
                      Cancel
                    </Text>

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