import { View, Text, Image, ScrollView, Modal, ActivityIndicator, Alert, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Pressable } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getMyListings } from '@/lib/listingService'
import { getUserProfile, logout, updateProfile, deleteAccount } from '@/lib/authService'
import { getFavorites } from '@/lib/favoriteService'
import profile from '../../assets/imgs/profile.jpeg'



const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState<'my listings' | 'favorites' | 'reviews'>('my listings');
  const [editProfile, setEditProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [listStats, setListStats] = useState([
    { label: 'Active', val: '0' },
    { label: 'Sold', val: '0' },
    { label: 'Rating', val: '0', icon: true }
  ]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const profileResult = await getUserProfile();
        if (profileResult.success && profileResult.data) {
          setUserData(profileResult.data);
          setListStats([
            { label: 'Active', val: String(profileResult.data.active_listings || 0) },
            { label: 'Sold', val: String(profileResult.data.sold_count || 0) },
            { label: 'Rating', val: String(profileResult.data.rating?.toFixed(1) || '0'), icon: true }
          ]);
        }
        
        // Fetch my listings
        const listingsResult = await getMyListings();
        if (listingsResult.success && listingsResult.listings) {
          setMyItems(listingsResult.listings);
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
          const result = await getFavorites();
          if (result.success && result.favorites) {
            setFavorites(result.favorites);
          }
        } catch (err: any) {
          Alert.alert('Error', 'Failed to load favorites');
        }
      };
      fetchFavorites();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/index');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // Edit Profile Form State
  const [editFormData, setEditFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    faculty: userData?.faculty || '',
    graduation_year: userData?.graduation_year?.toString() || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (!editFormData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    try {
      setSavingProfile(true);
      const updateData = {
        ...editFormData,
        graduation_year: editFormData.graduation_year ? parseInt(editFormData.graduation_year) : undefined,
      };
      const result = await updateProfile(updateData);
      if (result.success && result.data) {
        setUserData(result.data);
        setEditProfile(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
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
      'Are you sure you want to delete your account? This action cannot be undone.',
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
                router.replace('/(auth)/index');
              } else {
                Alert.alert('Error', result.message || 'Failed to delete account');
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

  const tabs = [
    { label: 'My Listings', value: 'my listings' },
    { label: 'Favorites', value: 'favorites' },
    { label: 'Reviews', value: 'reviews' }
  ]

  return (
    <SafeAreaView className='flex-1'>
      <View className="flex flex-col h-full overflow-hidden bg-white">

        <View className="sticky top-0 z-30 flex-row items-center justify-between p-4 pb-2 bg-background-light/80 backdrop-blur-md">
          <Text className="flex-1 text-xl tracking-tight font-display-bold">Profile</Text>
          <View className="flex items-center justify-end w-12">
            <Pressable className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5">
              <Ionicons name="settings-outline" size={25} color="#6769ef" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex flex-col items-center gap-6 p-4">
            <View className="flex flex-col items-center w-full gap-4">
              <View className="relative">
                <View className="overflow-hidden rounded-full shadow-lg size-32 ring-4 ring-white">
                  <Image source={profile} alt="Me" className="object-cover w-full h-full" />
                </View>
                <View className="absolute flex items-center justify-center p-1 text-white border-2 border-white rounded-full bottom-1 right-1 bg-primary">
                  <MaterialIcons name="verified" size={16} color="white" />
                </View>
              </View>
              <View className="flex flex-col items-center text-center">
                <Text className="text-3xl tracking-tight font-display-bold">{userData?.name || 'Loading...'}</Text>
                <Text className="mt-1 text-sm text-gray-500 font-display-medium">{userData?.email || 'user@university.ac.ke'}</Text>
              </View>
              <Pressable onPress={() => setEditProfile(true)}
                className="flex items-center justify-center w-full p-2 px-8 py-3 rounded-lg bg-primary">

                <Text className='text-2xl text-white font-display-medium'>
                  Edit Profile
                </Text>

              </Pressable>
            </View>
          </View>

          <View className="px-4 py-2">
            <View className="flex-row justify-between w-full gap-3">
              {listStats.map(stat => (
                <View key={stat.label} className="flex flex-col items-center flex-1 gap-1 p-4 text-center bg-white border border-gray-200 rounded-lg shadow-lg">
                  <View className="flex items-center gap-1">
                    <View className='flex-row items-center gap-1'>
                      <Text className="text-3xl font-display-bold">{stat.val}</Text>
                      {stat.icon && <Ionicons name="star" size={16} color="#fbbf24" />}
                    </View>

                  </View>
                  <Text className="text-gray-500 text-[11px] uppercase tracking-wider font-display-semibold">{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="flex-row justify-between w-full px-4 mt-6 border-b border-gray-100 ">
            {tabs.map(tab => (
              <Pressable
                onPress={() => setActiveTab(tab.value as any)}
                key={tab.value}
                className={`flex-1 border-b-[3px] ${tab.value === activeTab ? 'border-primary ' : 'border-transparent '} pb-3`}
              >
                <Text className={`text-xl ${tab.value === activeTab ? ' text-primary' : 'border-transparent text-gray-400'} text-center font-display-bold`}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View className="flex justify-center items-center h-64">
              <ActivityIndicator size="large" color="#6769ef" />
            </View>
          ) : error ? (
            <View className="p-4">
              <Text className="text-center text-red-500 font-display-bold">{error}</Text>
            </View>
          ) : activeTab === 'my listings' ? (
            <View className="flex-row flex-wrap justify-between w-full p-4 gap-y-4">
              {myItems.length > 0 ? (
                myItems.map(item => (
                  <Pressable key={item.id} className="flex-col w-48 gap-2 group" onPress={() => router.push(`/product-item/${item.id}`)}>
                    <View className="relative overflow-hidden rounded-2xl aspect-square bg-slate-100">
                      <Image source={{ uri: item.imageUrl }} className="object-cover w-full h-full" />
                      <View className="absolute px-2 py-1 rounded-lg top-2 left-2 bg-white/90 backdrop-blur">
                        <Text className='text-sm tracking-wide uppercase font-display-semibold'>{item.category}</Text>
                      </View>
                    </View>
                    <View className="px-1">
                      <Text className="text-xl leading-tight truncate font-display-bold">{item.title}</Text>
                      <Text className="text-primary text-md font-display-bold mt-0.5">Ksh {item.price.toFixed(2)}</Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <Text className="text-center text-gray-500 w-full pt-10 font-display">No listings yet</Text>
              )}
            </View>
          ) : activeTab === 'favorites' ? (
            <View className="flex-row flex-wrap justify-between w-full p-4 gap-y-4">
              {favorites.length > 0 ? (
                favorites.map(item => (
                  <Pressable key={item.id} className="flex-col w-48 gap-2 group" onPress={() => router.push(`/product-item/${item.id}`)}>
                    <View className="relative overflow-hidden rounded-2xl aspect-square bg-slate-100">
                      <Image source={{ uri: item.imageUrl }} className="object-cover w-full h-full" />
                      <View className="absolute px-2 py-1 rounded-lg top-2 left-2 bg-white/90 backdrop-blur">
                        <Text className='text-sm tracking-wide uppercase font-display-semibold'>{item.category}</Text>
                      </View>
                    </View>
                    <View className="px-1">
                      <Text className="text-xl leading-tight truncate font-display-bold">{item.title}</Text>
                      <Text className="text-primary text-md font-display-bold mt-0.5">Ksh {item.price.toFixed(2)}</Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <Text className="text-center text-gray-500 w-full pt-10 font-display">No favorites yet</Text>
              )}
            </View>
          ) : (
            <View className="p-4">
              <Text className="text-center text-gray-500 font-display-bold text-lg">🌟 Reviews Coming Soon</Text>
              <Text className="text-center text-gray-400 font-display mt-2">View feedback from buyers and sellers</Text>
            </View>
          )}

          <View className="p-6 pb-32">
            <Pressable onPress={handleLogout} className="flex items-center justify-center w-full gap-2 py-3 font-bold border border-red-500 rounded-lg bg-red-50">
              <Text className="text-xl text-red-500 font-display-bold">logout</Text>
            </Pressable>
            <Text className="text-center text-gray-400 text-md font-display-bold mt-4 uppercase tracking-[0.2em] ">CampusMart v1.0.0</Text>
          </View>
        </ScrollView>


      </View>

      {editProfile && (
        <Modal onRequestClose={() => setEditProfile(false)}
          animationType="slide" transparent={true}>
          <View className="justify-end flex-1 bg-black/40">
            <View className="w-full p-5 bg-white rounded-t-3xl max-h-[80%]">
              <View className="flex-row items-center justify-between w-full mb-4">
                <Text className="text-2xl font-display-bold">Edit Profile</Text>
                <Pressable onPress={() => setEditProfile(false)} disabled={savingProfile}>
                  <Ionicons name="close" size={24} color="#6769ef" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="gap-4 mb-4">
                {/* Name Field */}
                <View className="gap-2">
                  <Text className="font-display-bold text-gray-700">Full Name</Text>
                  <TextInput
                    value={editFormData.name}
                    onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-display bg-white"
                    placeholder="Enter your name"
                    editable={!savingProfile}
                  />
                </View>

                {/* Email Field */}
                <View className="gap-2">
                  <Text className="font-display-bold text-gray-700">Email</Text>
                  <TextInput
                    value={editFormData.email}
                    onChangeText={(text) => setEditFormData({ ...editFormData, email: text })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-display bg-white"
                    placeholder="your@university.ac.ke"
                    editable={false}
                  />
                </View>

                {/* Faculty Field */}
                <View className="gap-2">
                  <Text className="font-display-bold text-gray-700">Faculty</Text>
                  <TextInput
                    value={editFormData.faculty}
                    onChangeText={(text) => setEditFormData({ ...editFormData, faculty: text })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-display bg-white"
                    placeholder="Engineering, Sciences, etc."
                    editable={!savingProfile}
                  />
                </View>

                {/* Graduation Year Field */}
                <View className="gap-2">
                  <Text className="font-display-bold text-gray-700">Graduation Year</Text>
                  <TextInput
                    value={editFormData.graduation_year}
                    onChangeText={(text) => setEditFormData({ ...editFormData, graduation_year: text })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-display bg-white"
                    placeholder="2025"
                    keyboardType="numeric"
                    maxLength={4}
                    editable={!savingProfile}
                  />
                </View>

                <View className="mt-4 gap-3">
                  {/* Save Button */}
                  <Pressable
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                    className="justify-center w-full p-3 bg-primary rounded-lg"
                  >
                    {savingProfile ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-lg text-center text-white font-display-bold">Save Changes</Text>
                    )}
                  </Pressable>

                  {/* Delete Account Button */}
                  <Pressable
                    onPress={handleDeleteAccount}
                    disabled={savingProfile}
                    className="justify-center w-full p-3 bg-red-500 rounded-lg"
                  >
                    <Text className="text-lg text-center text-white font-display-bold">Delete Account</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  )
}

export default ProfileScreen