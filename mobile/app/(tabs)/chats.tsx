import { View, Text, Pressable, TextInput, Image, ScrollView, Modal } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Conversation } from '@/types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ChatScreen = () => {

    const conversations: Conversation[] = [
        {
            id: '1',
            participant: {
                name: 'Alex Rivera',
                avatarUrl: 'https://i.pravatar.cc/150?u=alex',
                isOnline: true
            },
            lastMessage: 'Is the Organic Chem Textbook still available?',
            timestamp: '2m ago',
            unreadCount: 1,
            listingThumb: 'https://picsum.photos/seed/chem/100',
            type: 'BUYING'
        },
        {
            id: '2',
            participant: {
                name: 'Campus Tech Store',
                avatarUrl: 'https://i.pravatar.cc/150?u=techstore',
                isOnline: false, isStore: true
            },
            lastMessage: 'Your lease for the Dorm Fridge is confirmed.',
            timestamp: '11:20 AM',
            unreadCount: 0,
            listingThumb: 'https://picsum.photos/seed/fridge/100',
            type: 'LEASING'
        },
        {
            id: '3',
            participant: {
                name: 'Jordan Smith',
                avatarUrl: 'https://i.pravatar.cc/150?u=jordan',
                isOnline: false
            },
            lastMessage: 'I can meet at the library at 5 PM.',
            timestamp: 'Yesterday',
            unreadCount: 0,
            listingThumb: 'https://picsum.photos/seed/calc/100',
            type: 'SELLING'
        }
    ];

    const tabs = [
        { label: 'All', value: 'all' },
        { label: 'Buying', value: 'buying' },
        { label: 'Selling', value: 'selling' }
    ]

    const [activeTab, setActiveTab] = useState<'all' | 'buying' | 'selling'>('all');

    const handleChatPress = (conv: Conversation) => {
        router.navigate({
            pathname: '/chats/chat',
            params: {
                id: conv.id,
                name: conv.participant.name,
                avatarUrl: conv.participant.avatarUrl,
                isOnline: String(conv.participant.isOnline),
                isStore: String(conv.participant.isStore ?? false),
                lastMessage: conv.lastMessage,
                timestamp: conv.timestamp,
                unreadCount: String(conv.unreadCount),
                listingThumb: conv.listingThumb,
                type: conv.type,
            }
        } as any);
    };


    const [createMessage, setCreateMessage] = useState<boolean>(false);


    return (
        <SafeAreaView className='flex-1'>
            <View className="flex-1 flex-col h-full bg-background-light  overflow-hidden">

                <View className="sticky top-0 z-20 bg-background-light/80  backdrop-blur-md px-4 pt-12 pb-2">

                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-2xl font-display-bold tracking-tight">Messages</Text>
                        <View className="flex-row gap-2">
                            <Pressable className="flex items-center justify-center size-10 rounded-full bg-gray-100 ">
                                <Ionicons name="search-outline" size={20} color="black" />
                            </Pressable>
                            <Pressable onPress={() => setCreateMessage(true)} className="flex items-center justify-center size-10 rounded-full bg-primary text-white">
                                <Ionicons name="create-outline" size={20} color="white" />
                            </Pressable>
                        </View>
                    </View>

                    <View className="px-2 py-3">
                        <View className="flex-row items-center bg-white border border-gray-300 rounded-xl">
                            <View className="flex-row items-center pl-4 pr-3 ">
                                <Ionicons name='search' size={24} color="#9CA3AF" />
                            </View>
                            <TextInput
                                className="flex-1 p-3.5 pl-3 text-xl font-display"
                                placeholder="Search people ,conversations..."
                                keyboardType='default'
                            />

                        </View>

                    </View>


                    <View className="flex-row w-full items-center border-b border-gray-100  gap-8">
                        {tabs.map(tab => (
                            <Pressable
                                key={tab.value}
                                className={`border-b-2  py-2 px-5   tracking-wider 
                                    ${activeTab === tab.value ? 'border-primary ' : ' border-transparent'}`}
                                onPress={() => setActiveTab(tab.value as any)}
                            >
                                <Text className={`text-lg font-display-medium 
                                    ${activeTab === tab.value ? 'border-primary text-primary' : ' text-gray-400'}`}>
                                    {tab.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <ScrollView className="flex-1 overflow-y-auto px-4 pb-24 space-y-3 pt-2">
                    {conversations.map(conv => (
                        <Pressable
                            key={conv.id}
                            onPress={() => handleChatPress(conv)}
                            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100/50  flex-row gap-4 relative">

                            <View className="relative shrink-0">
                                <View className="size-14 rounded-full overflow-hidden border-2 border-white ">
                                    <Image source={{ uri: conv.participant.avatarUrl }}
                                        alt={conv.participant.name}
                                        className="w-full h-full object-cover" />
                                </View>
                                {conv.participant.isOnline && (
                                    <View className="absolute bottom-0 right-0 size-3.5 bg-success border-2 border-white  rounded-full" />
                                )}
                            </View>


                            <View className="flex flex-col ml-3 flex-1 min-w-0 justify-center">

                                <View className="flex-row justify-between items-start mb-0.5">
                                    <View className="flex-row items-center gap-1">
                                        <Text className="font-display-semibold text-lg truncate">{conv.participant.name}</Text>
                                        {conv.participant.isStore && <MaterialIcons name="verified" size={16} color="#6769ef" />}
                                    </View>
                                    <Text className={`text-md font-display-medium ${conv.unreadCount > 0 ? 'text-primary' : 'text-gray-400'}`}>{conv.timestamp}</Text>
                                </View>

                                <Text className={`text-md line-clamp-1 mb-1 
                                    ${conv.unreadCount > 0 ? 'font-display text-[#6769ef] ' : 'text-gray-500'}`}>{conv.lastMessage}
                                </Text>

                                <View className="flex items-start gap-1.5">
                                    <Text className="text-sm px-1.5 py-0.5 bg-gray-100  text-gray-500 rounded uppercase font-display-light tracking-tight">{conv.type}</Text>
                                </View>
                            </View>

                            <View className="flex flex-col items-end justify-between shrink-0">
                                <View className="size-10 rounded-md overflow-hidden border border-gray-100">
                                    <Image source={{ uri: conv.listingThumb }} alt="Listing" className="w-full h-full object-cover" />
                                </View>
                                {conv.unreadCount > 0 && (
                                    <View className="size-5 bg-primary rounded-full flex items-center justify-center">
                                        <Text className="text-[10px] text-white font-bold">{conv.unreadCount}</Text>
                                    </View>
                                )}
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>

            </View>

            {createMessage && (
                <Modal transparent animationType="slide" visible={!!createMessage} onRequestClose={() => setCreateMessage(false)}>
                    <View className="flex-1 items-center justify-end bg-black/50">
                        <View className="w-full bg-white rounded-t-3xl p-6">

                            <View className="flex-row justify-between w-full items-center">
                                <Text className='text-xl font-display-bold'>Send New Message</Text>
                                <View className='bg-gray-100 rounded-full p-2'>
                                    <Ionicons name="close" size={24} color="black" onPress={() => setCreateMessage(false)} />
                                </View>
                            </View>

                            <Text className='text-gray-400 font-display-semibold mb-3'>
                                Select or search a conversation to start messaging</Text>

                            <View className="px-2 py-3">
                                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl">
                                    <View className="flex-row items-center pl-4 pr-3 ">
                                        <Ionicons name='search' size={24} color="#9CA3AF" />
                                    </View>
                                    <TextInput
                                        className="flex-1 p-3.5 pl-3 text-xl font-display"
                                        placeholder="Search people ,conversations..."
                                        keyboardType='default'
                                    />

                                </View>

                            </View>

                            {conversations.map(conv => (
                                <Pressable
                                    key={conv.id}
                                    className="bg-gray-100 items-center flex-row justify-between w-full gap-2 rounded-lg p-4 mb-2"
                                    onPress={() => {
                                        setCreateMessage(false);
                                        // Handle conversation selection
                                    }}
                                >
                                    <View className="flex-row gap-2 items-center">
                                        <Image source={{ uri: conv.participant.avatarUrl }} className="size-10 rounded-full mb-2" />
                                        <View>
                                            <Text className='text-xl text-gray-600 font-display-bold'>{conv.participant.name}</Text>
                                            <Text className={`text-sm ${conv.participant.isOnline ? 'text-green-500' : 'text-gray-400'} font-display-medium`}>{conv.participant.isOnline ? 'Online' : 'Offline'}</Text>
                                        </View>

                                    </View>

                                    <Ionicons name='chatbubble-ellipses-outline' size={20} color="black" />

                                </Pressable>
                            ))}
                        </View>
                    </View>
                </Modal>
            )}

        </SafeAreaView>
    )
}

export default ChatScreen