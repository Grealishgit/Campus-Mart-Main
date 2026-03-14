import { View, Text, Pressable, TextInput, ScrollView } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { formatAIResponse } from '@/lib/helper';

const AiChat = () => {

    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
        {
            role: 'model',
            text: 'Hi! I\'m your CampusMart Assistant. Need help finding a textbook, figuring out dorm essentials, or checking campus lease rules? Ask me anything!'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    // const listAvailableModels = async () => {
    //     try {
    //         const apiKey = 'AIzaSyB6AGxptOxlDaIBaAWpIiHNCtuD8a2QJg0';
    //         const response = await fetch(
    //             `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    //         );
    //         const data = await response.json();

    //         console.log('All available models:', data.models?.map(m => ({
    //             name: m.name,
    //             displayName: m.displayName,
    //             supportedMethods: m.supportedMethods
    //         })));

    //         // Filter models that support generateContent
    //         const generateContentModels = data.models?.filter(m =>
    //             m.supportedMethods?.includes('generateContent')
    //         ).map(m => m.name);

    //         console.log('Models that support generateContent:', generateContentModels);

    //         return generateContentModels;
    //     } catch (err) {
    //         console.error('Failed to fetch models:', err);
    //         return [];
    //     }
    // };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

            // Use the latest flash model
            const model = 'gemini-flash-latest';

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: userMsg }
                                ]
                            }
                        ],
                        systemInstruction: {
                            parts: [
                                {
                                    text: 'You are an AI Campus Assistant for CampusMart, a university marketplace. Important formatting rules: DO NOT use any markdown syntax like asterisks (*), dashes (-), or bullet points. Write in plain, natural sentences. Use emojis occasionally 😊. Be friendly, energetic, and concise. Help students with buying advice, textbook search tips, dorm decor ideas, and safety tips for campus trading. Mention that CampusMart is the safest way to trade on campus.'
                                }
                            ]
                        },
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 800,
                        }
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error('API Error:', data);
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: ` Error: ${data.error?.message || 'Failed to get response'}`
                }]);
                return;
            }

            let modelText = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "I'm sorry, I couldn't process that. Can you try again? ";

            // Clean up the text by removing markdown syntax
            modelText = formatAIResponse(modelText);

            setMessages(prev => [...prev, { role: 'model', text: modelText }]);

        } catch (err) {
            console.error('Error:', err);
            setMessages(prev => [...prev, {
                role: 'model',
                text: 'Oops! Connection issue. Check your internet and try again! 📡'
            }]);
        } finally {
            setLoading(false);
        }
    };


    // Call this when component mounts to see available models
    // useEffect(() => {
    //     listAvailableModels();
    // }, []);

    const quickSuggestions = [
        'Dorm list',
        'Safety tips',
        'Textbook help'
    ]

    return (
        <SafeAreaView>
            <View className="flex flex-col h-full bg-slate-50  overflow-hidden animate-slide-up">
                <View className="bg-primary  p-6 pb-12 rounded-b-[2.5rem] relative">

                    <View className="flex-row items-center justify-between mb-6">
                        <Pressable onPress={() => router.replace('/(tabs)')}
                            className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md">
                            <Ionicons name="chevron-back" size={20} color="white" />
                        </Pressable>
                        <View className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                            <Text className="text-white text-[10px] font-display-bold uppercase tracking-[0.2em]">Smart Assistant</Text>
                        </View>
                        <Pressable className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md">
                            <MaterialCommunityIcons name="dots-horizontal" size={24} color="white" />
                        </Pressable>
                    </View>

                    <View className="flex flex-col items-center gap-2">
                        <View className="size-20 bg-white rounded-3xl shadow-xl flex items-center justify-center rotate-3 relative overflow-hidden">
                            <Ionicons name="sparkles" size={28} color="#6769ef" />
                            <View className="absolute inset-0 bg-primary/5 animate-pulse"></View>
                        </View>
                        <Text className="text-3xl font-display-bold text-white mt-2">How can I help?</Text>
                        <Text className="text-white/70 font-display-semibold text-md">Expert campus smart assistant</Text>
                    </View>
                </View>

                <ScrollView
                    ref={scrollRef}
                    className="flex-1  px-6 py-8"
                    contentContainerStyle={{ gap: 24, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((m, i) => (
                        <View key={i} className={`flex-row ${m.role === 'user' ? 'justify-end items-end' : 'justify-start items-start'}`}>
                            <View className={`p-4 rounded-2xl mb-8 max-w-[85%] text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                ? 'bg-primary rounded-br-none'
                                : 'bg-white rounded-bl-none border border-gray-100 '
                                }`}>
                                <Text className={`${m.role === 'user'
                                    ? ' text-white  text-lg font-display'
                                    : 'text-slate-800 text-lg  font-display'
                                    }`}> {m.text}</Text>
                            </View>
                        </View>
                    ))}
                    {loading && (
                        <View className="flex mb-8 justify-start">
                            <View className="bg-white flex-row p-4 rounded-2xl  border border-gray-100  gap-1.5">
                                <View className="size-1.5 bg-primary/80 rounded-full animate-bounce" />
                                <View className="size-2 bg-primary/60 rounded-full animate-bounce delay-100" />
                                <View className="size-2.5 bg-primary/40 rounded-full animate-bounce delay-200" />
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View className="p-5 bg-white  border-t border-gray-100  pb-5">
                    <View className="flex-row gap-2">
                        <TextInput
                            value={input}
                            onChangeText={setInput}
                            placeholder="Type your question..."
                            className="flex-1 bg-gray-100 font-display border-none rounded-2xl py-4 px-6 text-lg"
                        />
                        <Pressable
                            onPress={handleSend}
                            disabled={loading || !input.trim()}
                            className={`size-14 rounded-2xl flex items-center justify-center ${input.trim() ? 'bg-primary  ' : 'bg-gray-100 '
                                }`}
                        >
                            <Ionicons name={input.trim() ? 'send' : 'sparkles'} size={20} color={input.trim() ? 'white' : '#9CA3AF'} />
                        </Pressable>
                    </View>
                    <View className="mt-4 flex-row gap-2 overflow-x-auto">
                        {quickSuggestions.map(suggestion => (
                            <Pressable
                                key={suggestion}
                                onPress={() => setInput(suggestion)}
                                className="px-4 py-2 bg-slate-100   rounded-full whitespace-nowrap "
                            >
                                <Text className='font-display-semibold text-gray-400 text-md'>{suggestion}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default AiChat