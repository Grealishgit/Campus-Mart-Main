import { View, Text, Pressable, TextInput, Image, ScrollView, Modal, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Conversation, getConversations } from '@/lib/chatService'

const ChatScreen = () => {

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);

    const tabs = [
        { label: 'All', value: 'all' },
        { label: 'Buying', value: 'buying' },
        { label: 'Selling', value: 'selling' }
    ]

    const [activeTab, setActiveTab] = useState<'all' | 'buying' | 'selling'>('all');
    const [searchValue, setSearchValue] = useState('');

    const fetchConversations = React.useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getConversations();
        if (result.success && result.data?.conversations) {
          setConversations(result.data.conversations);
          filterConversations(result.data.conversations, 'all', '');
        } else {
          setError(result.error || 'Failed to load conversations');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    }, []);

    useFocusEffect(
      React.useCallback(() => {
        fetchConversations();
      }, [fetchConversations])
    );

    const filterConversations = (convs: Conversation[], tab: string, search: string) => {
      let filtered = convs;
      
      if (tab !== 'all') {
        filtered = filtered.filter(c => c.type?.toLowerCase() === tab);
      }
      
      if (search.trim()) {
        filtered = filtered.filter(c => 
          c.participant.name.toLowerCase().includes(search.toLowerCase()) ||
          c.lastMessage?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setFilteredConversations(filtered);
    };

    const handleTabChange = (tab: 'all' | 'buying' | 'selling') => {
      setActiveTab(tab);
      filterConversations(conversations, tab, searchValue);
    };

    const handleSearch = (text: string) => {
      setSearchValue(text);
      filterConversations(conversations, activeTab, text);
    };

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
                listingTitle: conv.listingTitle,
            }
        } as any);
    };


    const [createMessage, setCreateMessage] = useState<boolean>(false);

    const formatRelativeTime = (iso?: string): string => {
        if (!iso) return '';
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (diff < 60000) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'yesterday';
        if (days < 7) return `${days}d ago`;
        return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
    };


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
                                value={searchValue}
                                onChangeText={handleSearch}
                            />

                        </View>

                    </View>


                    <View className="flex-row w-full items-center border-b border-gray-100  gap-8">
                        {tabs.map(tab => (
                            <Pressable
                                key={tab.value}
                                className={`border-b-2  py-2 px-5   tracking-wider 
                                    ${activeTab === tab.value ? 'border-primary ' : ' border-transparent'}`}
                                onPress={() => handleTabChange(tab.value as any)}
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
                    {loading ? (
                      <View className="flex justify-center items-center h-64">
                        <ActivityIndicator size="large" color="#6769ef" />
                      </View>
                    ) : error ? (
                      <View className="p-4">
                        <Text className="text-center text-red-500 font-display-bold">{error}</Text>
                      </View>
                    ) : filteredConversations.length === 0 ? (
                      <View className="p-4 mt-10">
                        <Text className="text-center text-gray-500 font-display">No conversations found</Text>
                      </View>
                    ) : (
                      filteredConversations.map(conv => (
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
                                      <Text className={`text-md font-display-medium ${conv.unreadCount > 0 ? 'text-primary' : 'text-gray-400'}`}>{formatRelativeTime(conv.timestamp)}</Text>
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
                      ))
                    )}
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
