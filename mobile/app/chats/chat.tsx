import { View, Text, Pressable, Image, TextInput, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Message, Conversation } from '@/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ChatScreen = () => {

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hey! Is this still available?',
            sender: 'me',
            timestamp: '10:00 AM'
        },
        {
            id: '2',
            text: 'Yes it is! I can meet you later today.',
            sender: 'them',
            timestamp: '10:05 AM'
        },
        {
            id: '3',
            text: 'Perfect. Does 5 PM at the Library work?',
            sender: 'me',
            timestamp: '10:06 AM'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<ScrollView>(null);

    const {
        id,
        name,
        avatarUrl,
        isOnline,
        isStore,
        lastMessage,
        timestamp,
        unreadCount,
        listingThumb,
        type,
    } = useLocalSearchParams<{
        id?: string;
        name?: string;
        avatarUrl?: string;
        isOnline?: string;
        isStore?: string;
        lastMessage?: string;
        timestamp?: string;
        unreadCount?: string;
        listingThumb?: string;
        type?: 'BUYING' | 'SELLING' | 'LEASING';
    }>();

    const conversation: Conversation = {
        id: id ?? '0',
        participant: {
            name: name ?? 'Unknown',
            avatarUrl: avatarUrl ?? 'https://i.pravatar.cc/100?u=placeholder',
            isOnline: isOnline === 'true',
            isStore: isStore === 'true',
        },
        lastMessage: lastMessage ?? '',
        timestamp: timestamp ?? '',
        unreadCount: Number(unreadCount ?? 0),
        listingThumb: listingThumb ?? 'https://picsum.photos/seed/placeholder/200/200',
        type: type ?? 'BUYING',
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'me',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([...messages, newMessage]);
        setInputValue('');
    };


    return (
        <SafeAreaView>
            <View className="flex flex-col h-full bg-gray-50  animate-slide-in-right">

                <View className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100  p-3 flex-row items-center gap-3">
                    <Pressable onPress={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 ">
                        <Ionicons name="chevron-back" size={25} color="black" />
                    </Pressable>
                    <View className="relative shrink-0">
                        <Image source={{ uri: conversation.participant.avatarUrl }} className="size-14 rounded-full object-cover" />
                        {conversation.participant.isOnline && (
                            <View className="absolute bottom-0 right-0 size-3 bg-success border-2 border-white  rounded-full"></View>
                        )}
                    </View>
                    <View className="flex-1 min-w-0">
                        <Text className="font-display-bold text-xl truncate">{conversation.participant.name}</Text>
                        <Text className={`text-md  ${conversation.participant.isOnline ? 'text-green-500' : 'text-gray-500'}  font-display tracking-wider`}>
                            {conversation.participant.isOnline ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Pressable className="p-2 rounded-full  bg-white shadow">
                            <Ionicons name="videocam-outline" size={25} color="gray" />
                        </Pressable>
                        <Pressable className="p-2 rounded-full bg-white shadow">
                            <MaterialCommunityIcons name="information-outline" size={24} color="gray" />
                        </Pressable>
                    </View>
                </View>



                <View className="px-4 py-3 bg-white  flex-row items-center gap-3">
                    <View className="size-10 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                        <Image source={{ uri: conversation.listingThumb }} className="w-full h-full object-cover" />
                    </View>
                    <View className="flex-1 min-w-0">
                        <Text className="text-md font-display-bold text-primary uppercase tracking-widest">Inquiry About</Text>
                        <Text className="text-xs font-display-semibold truncate">Listing ID: #{conversation.id.padStart(5, '0')}</Text>
                    </View>
                    <Pressable className="bg-primary px-5 py-2.5 rounded-xl">
                        <Text className="text-white font-display-bold">View Listing</Text>
                    </Pressable>
                </View>

                <ScrollView
                    ref={scrollRef}
                    className="flex-1 p-4"
                    contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex items-center justify-center my-4">
                        <Text className="text-sm font-display-semibold text-gray-400 bg-gray-100  px-3 py-1 rounded-full uppercase tracking-widest">Today</Text>
                    </View>

                    {messages.map((msg) => (
                        <View key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end items-end' : 'justify-start items-start'}`}>
                            <View className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm
                             ${msg.sender === 'me'
                                    ? 'bg-primary  rounded-tr-none shadow-md shadow-primary/10'
                                    : 'bg-white  text-slate-800  rounded-tl-none border border-gray-100 '
                                }`}>
                                <Text className={`font-display ${msg.sender === 'me' ? 'leading-relaxed text-white' : 'leading-relaxed text-slate-800'}`}>
                                    {msg.text}
                                </Text>
                                <View className={`flex-row items-center gap-1 mt-0.5 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <Text className={`text-sm  mt-1.5 font-display opacity-60 ${msg.sender === 'me' ? 'text-white' : 'text-gray-700'}`}>
                                        {msg.timestamp}
                                    </Text>
                                </View>

                            </View>
                        </View>
                    ))}
                </ScrollView>

                <View className="p-4 bg-white  border-t border-gray-100 b-10">
                    <View className="flex-row items-center gap-2">
                        <Pressable className="p-2 rounded-full bg-white">
                            <Ionicons name="add-circle-outline" size={28} color="#6769ef" />
                        </Pressable>
                        <View className="flex-1 relative">
                            <TextInput
                                value={inputValue}
                                onChangeText={setInputValue}
                                className="w-full bg-gray-100 font-display border-none rounded-full py-3 px-5 text-md"
                                placeholder="Write a message..."
                            />
                            <Pressable className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400">
                                <Ionicons name="happy-outline" size={24} color="#6b7280" />
                            </Pressable>
                        </View>
                        <Pressable
                            onPress={handleSend}
                            disabled={!inputValue.trim()}
                            className={`size-11 rounded-full flex items-center justify-center transition-all ${inputValue.trim() ? 'bg-primary text-white scale-100' : 'bg-gray-100 text-gray-400 scale-90'
                                }`}
                        >
                            <Ionicons name="send" size={24} color={inputValue.trim() ? 'white' : '#9CA3AF'} />
                        </Pressable>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default ChatScreen