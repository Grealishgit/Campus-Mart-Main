import {
    View, Text, Pressable, Image, TextInput,
    ScrollView, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';
import { Message, getConversationMessages, sendMessage } from '@/lib/chatService';

// ─── helpers ─────────────────────────────────────────────────
const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso; // fallback if already formatted
    return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateLabel = (iso?: string) => {
    if (!iso) return 'Today';
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Group messages by date
const groupByDate = (msgs: Message[]) => {
    const groups: { label: string; messages: Message[] }[] = [];
    let currentLabel = '';

    for (const msg of msgs) {
        const label = formatDateLabel(msg.timestamp);
        if (label !== currentLabel) {
            groups.push({ label, messages: [msg] });
            currentLabel = label;
        } else {
            groups[groups.length - 1].messages.push(msg);
        }
    }
    return groups;
};

// ─── TYPE badge colour ────────────────────────────────────────
const TYPE_COLOR: Record<string, { bg: string; text: string }> = {
    BUYING: { bg: '#dbeafe', text: '#1e40af' },
    LEASING: { bg: '#ede9fe', text: '#6d28d9' },
    SELLING: { bg: '#d1fae5', text: '#065f46' },
};

const ChatScreen = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    const {
      id, name, avatarUrl, isOnline,
      lastMessage, timestamp, unreadCount,
      listingThumb, listingTitle, type,
  } = useLocalSearchParams<{
      id?: string;
      name?: string;
      avatarUrl?: string;
      isOnline?: string;
      lastMessage?: string;
      timestamp?: string;
      unreadCount?: string;
      listingThumb?: string;
      listingTitle?: string;
      type?: 'BUYING' | 'SELLING' | 'LEASING';
  }>();

    const loadMessages = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const result = await getConversationMessages(id);
            if (result.success && result.data?.messages) {
              setMessages(result.data.messages);
          } else {
              setError('Failed to load messages');
          }
      } catch (err: any) {
          setError(err.message || 'Error loading messages');
      } finally {
          setLoading(false);
      }
  }, [id]);

    useFocusEffect(useCallback(() => { loadMessages(); }, [loadMessages]));

    useEffect(() => {
        if (scrollRef.current && messages.length > 0) {
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
  }, [messages]);

    const handleSend = async () => {
      if (!inputValue.trim() || !id || sending) return;
      const text = inputValue.trim();
      setInputValue('');

      // Optimistic message
      const optimistic: Message = {
          id: `temp-${Date.now()}`,
          text,
          sender: 'me',
          timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);

      try {
          setSending(true);
        const result = await sendMessage(id, text);
        if (!result.success) {
            // Remove optimistic on failure
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setInputValue(text);
            Alert.alert('Error', 'Failed to send message');
      } else {
          // Refresh to get server-assigned ID and timestamp
          await loadMessages();
        }
    } catch (err: any) {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setInputValue(text);
          Alert.alert('Error', err.message || 'Failed to send message');
      } finally {
          setSending(false);
      }
  };

    const typeStyle = TYPE_COLOR[type ?? 'BUYING'] ?? TYPE_COLOR.BUYING;
    const grouped = groupByDate(messages);

    return (
      <SafeAreaView className="flex-1 bg-gray-50">
          <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
              {/* ── Header ───────────────────────────────────── */}
              <View className="flex-row items-center gap-3 px-3 py-3 bg-white border-b border-gray-100">
                  <Pressable
                      onPress={() => router.back()}
                      className="items-center justify-center w-9 h-9 rounded-full active:bg-gray-100"
                  >
                      <Ionicons name="chevron-back" size={22} color="#111827" />
                  </Pressable>

                  <View className="relative">
                      {avatarUrl
                          ? <Image source={{ uri: avatarUrl }} className="w-10 h-10 rounded-full" />
                          : <View className="items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                              <Ionicons name="person" size={20} color="#6769ef" />
                          </View>
                      }
                      {isOnline === 'true' && (
                          <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                  </View>

                  <View className="flex-1">
                      <Text className="text-base text-gray-900 font-display-bold" numberOfLines={1}>
                          {name ?? 'Unknown'}
                      </Text>
                      <Text className={`text-xs font-display ${isOnline === 'true' ? 'text-green-500' : 'text-gray-400'}`}>
                          {isOnline === 'true' ? 'Online' : 'Offline'}
                      </Text>
                  </View>

                  {/* Type badge */}
                  <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: typeStyle.bg }}>
                      <Text className="text-[10px] uppercase tracking-wider font-display-bold" style={{ color: typeStyle.text }}>
                          {type ?? 'BUYING'}
                      </Text>
                  </View>
              </View>

              {/* ── Listing banner ───────────────────────────── */}
              {(listingThumb || listingTitle) && (
                  <View className="flex-row items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-100">
                      {listingThumb && (
                          <View className="overflow-hidden border border-gray-100 w-9 h-9 rounded-xl">
                              <Image source={{ uri: listingThumb }} className="w-full h-full" resizeMode="cover" />
                          </View>
                      )}
                      <View className="flex-1">
                          <Text className="text-[10px] text-primary uppercase tracking-widest font-display-semibold">
                              Inquiry about
                          </Text>
                          <Text className="text-xs text-gray-700 font-display-semibold" numberOfLines={1}>
                              {listingTitle || `Listing #${id?.padStart(5, '0')}`}
                          </Text>
                      </View>
                  </View>
              )}

              {/* ── Messages ─────────────────────────────────── */}
              <ScrollView
                  ref={scrollRef}
                  className="flex-1 px-4"
                  contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              >
                  {loading ? (
                      <View className="items-center justify-center py-20">
                          <ActivityIndicator size="large" color="#6769ef" />
                          <Text className="mt-3 text-sm text-gray-400 font-display">Loading messages…</Text>
                      </View>
                  ) : error ? (
                          <View className="items-center justify-center py-20">
                              <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
                              <Text className="mt-2 text-sm text-red-500 font-display-semibold">{error}</Text>
                              <Pressable onPress={loadMessages} className="mt-3 px-5 py-2 bg-primary rounded-xl">
                                  <Text className="text-white font-display-semibold">Retry</Text>
                              </Pressable>
                          </View>
                      ) : messages.length === 0 ? (
                              <View className="items-center justify-center py-20">
                                  <Ionicons name="chatbubble-outline" size={44} color="#d1d5db" />
                                  <Text className="mt-3 text-gray-400 font-display text-sm text-center">
                                      No messages yet.{'\n'}Send a message to start the conversation.
                                  </Text>
                              </View>
                          ) : (
                              grouped.map(group => (
                                  <View key={group.label}>
                                      {/* Date label */}
                                      <View className="items-center my-4">
                                          <View className="px-3 py-1 bg-gray-100 rounded-full">
                                              <Text className="text-[10px] text-gray-400 font-display-semibold uppercase tracking-widest">
                                                  {group.label}
                                              </Text>
                                          </View>
                                      </View>

                    {group.messages.map((msg, i) => {
                        const isMe = msg.sender === 'me';
                        const showAvatar = !isMe && (i === 0 || group.messages[i - 1]?.sender === 'me');

                    return (
                        <View
                            key={msg.id}
                            className={`flex-row mb-2 ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}
                        >
                            {/* Other person avatar */}
                            {!isMe && (
                                <View className="w-7 h-7 mb-1">
                                    {showAvatar && avatarUrl
                                        ? <Image source={{ uri: avatarUrl }} className="w-7 h-7 rounded-full" />
                                        : showAvatar
                                            ? <View className="items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                                                <Ionicons name="person" size={14} color="#6769ef" />
                                            </View>
                                            : null
                                    }
                        </View>
                          )}

                          <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                              <View
                                  className={`px-4 py-2.5 ${isMe
                                          ? 'bg-primary rounded-2xl rounded-br-sm'
                                          : 'bg-white border border-gray-100 rounded-2xl rounded-bl-sm'
                                      }`}
                                  style={isMe ? {
                                      shadowColor: '#6769ef',
                                      shadowOffset: { width: 0, height: 2 },
                                      shadowOpacity: 0.15,
                                      shadowRadius: 4,
                                      elevation: 2,
                                  } : undefined}
                              >
                                  <Text className={`text-sm font-display leading-relaxed ${isMe ? 'text-white' : 'text-gray-800'}`}>
                                      {msg.text}
                                  </Text>
                              </View>
                              <Text className="text-[10px] text-gray-400 font-display mt-1 mx-1">
                                  {formatTime(msg.timestamp)}
                              </Text>
                          </View>
                      </View>
                    );
                })}
                </View>
            ))
                  )}
              </ScrollView>

              {/* ── Input bar ────────────────────────────────── */}
              <View className="flex-row items-end gap-2 px-3 py-3 bg-white border-t border-gray-100">
                  <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 min-h-[44px] justify-center">
                      <TextInput
                          value={inputValue}
                          onChangeText={setInputValue}
                          placeholder="Write a message…"
                          placeholderTextColor="#9ca3af"
                          className="text-sm text-gray-900 font-display"
                          multiline
                          maxLength={1000}
                          style={{ maxHeight: 100 }}
                          onSubmitEditing={handleSend}
                          returnKeyType="send"
                          blurOnSubmit={false}
                      />
                  </View>

                  <Pressable
                      onPress={handleSend}
                      disabled={!inputValue.trim() || sending}
                      className="items-center justify-center w-11 h-11 rounded-full"
                      style={{
                          backgroundColor: inputValue.trim() && !sending ? '#6769ef' : '#f3f4f6',
                      }}
                  >
                      {sending
                          ? <ActivityIndicator size="small" color="#6769ef" />
                          : <Ionicons name="send" size={18} color={inputValue.trim() ? 'white' : '#9ca3af'} />
                      }
                  </Pressable>
              </View>
          </KeyboardAvoidingView>
      </SafeAreaView>
    );
};

export default ChatScreen;