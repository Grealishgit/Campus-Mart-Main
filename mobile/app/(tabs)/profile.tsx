import { View, Text, Image, ScrollView, Modal } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Pressable } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import profile from '../../assets/imgs/profile.jpeg'


const myItems = [
  {
    id: '1',
    title: 'Organic Chem Kit',
    price: 45, category: 'Science',
    imageUrl: 'https://picsum.photos/seed/kit/300'
  },
  {
    id: '2',
    title: 'Scientific Calculator',
    price: 20, category: 'Tools',
    imageUrl: 'https://picsum.photos/seed/calc/300'
  },
  {
    id: '3',
    title: 'Unisex Lab Coat',
    price: 15,
    category: 'Apparel',
    imageUrl: 'https://picsum.photos/seed/coat/300'
  },
  {
    id: '4',
    title: 'LED Desk Lamp',
    price: 10,
    category: 'Dorm',
    imageUrl: 'https://picsum.photos/seed/lamp/300'
  }
];

const listStats = [
  { label: 'Active', val: '12' },
  { label: 'Sold', val: '48' },
  { label: 'Rating', val: '4.9', icon: true }
]



const ProfileScreen = () => {

  const [activeTab, setActiveTab] = useState<'my listings' | 'favorites' | 'reviews'>('my listings');

  const [editProfile, setEditProfile] = useState<boolean>(false);

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
                <Text className="text-3xl tracking-tight font-display-bold">Arnold Njeru (Big G)</Text>
                <Text className="mt-1 text-sm text-gray-500 font-display-medium">Faculty of Science • Class of 2025</Text>
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

          <View className="flex-row flex-wrap justify-between w-full p-4 gap-y-4">
            {myItems.map(item => (
              <View key={item.id} className="flex-col w-48 gap-2 group">
                <View className="relative overflow-hidden rounded-2xl aspect-square bg-slate-100">
                  <Image source={{ uri: item.imageUrl }} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" alt={item.title} />
                  <View className="absolute px-2 py-1 rounded-lg top-2 left-2 bg-white/90 backdrop-blur ">
                    <Text className='text-sm tracking-wide uppercase font-display-semibold'>{item.category}</Text>
                  </View>
                </View>
                <View className="px-1">
                  <Text className="text-xl leading-tight truncate font-display-bold">{item.title}</Text>
                  <Text className="text-primary text-md font-display-bold mt-0.5">Ksh {item.price.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>

          <View className="p-6 pb-32">
            <Pressable onPress={() => router.navigate('/(auth)/SignIn')} className="flex items-center justify-center w-full gap-2 py-3 font-bold border border-red-500 rounded-lg bg-red-50">
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
            <View className="w-full p-5 bg-white rounded-t-3xl">
              <View className="flex-row items-center justify-between w-full mb-4">
                <Text className="text-2xl font-display-bold">Edit Profile</Text>
                <Pressable onPress={() => setEditProfile(false)}>
                  <Ionicons name="close" size={24} color="#6769ef" />
                </Pressable>
              </View>


              <View className='flex items-center justify-center w-full p-3'>
                <Text className='text-xl text-center font-display-bold'>Editing Profile Here</Text>
                <Pressable className='justify-center w-full p-2 py-3 mt-3 bg-red-500 rounded-lg'>
                  <Text className='text-2xl text-center text-white font-display-bold'>Delete Account</Text>
                </Pressable>
              </View>

            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  )
}

export default ProfileScreen