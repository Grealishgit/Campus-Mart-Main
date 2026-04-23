import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';



const OnboardingScreen = () => {

    const [step, setStep] = useState(0);
    const [onboarded, setOnborded] = useState(false);

    const router = useRouter();

    const steps = [
        {
            title: "Buy & Sell with Trust",
            description: "Trade textbooks, electronics, and more safely within your campus community.",
            icon: <FontAwesome name="handshake-o" size={58} color="primary" />
        },
        {
            title: "Academic Verification",
            description: "Every user is verified with their university email to ensure a safe peer-to-peer environment.",
            icon: <MaterialIcons name="library-books" size={58} color="primary" />
        },
        {
            title: "Flexible Leases",
            description: "Need a calculator for a week? Or a fridge for a semester? Leasing made simple.",
            icon: <Entypo name="book" size={58} color="primary" />
        }
    ];

    const nextStep = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            router.replace('/(auth)' as any);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Skip Button */}
            <View className="items-end px-6 pt-6 pb-2">
                <Pressable onPress={() => router.replace('/(auth)' as any)}>
                    <Text className="text-2xl tracking-wide text-primary font-display-medium">
                        Skip
                    </Text>
                </Pressable>
            </View>


            {/* Content */}
            <View className="items-center justify-center flex-1 px-8">

                <View className="flex items-center justify-center" style={{ marginBottom: 32 }}>
                    <Text className="text-5xl font-display-bold text-primary">
                        Campus Mart
                    </Text>
                </View>

                {/* Icon Circle */}
                <View className="items-center justify-center w-64 h-64 mb-8">
                    <View className="items-center justify-center w-64 h-64 border rounded-full border-primary/20 bg-[#eeeef9]">
                        <View className="items-center justify-center bg-white shadow-xl w-28 h-28 rounded-2xl">
                            <Text className="text-6xl text-primary">
                                {steps[step].icon}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Text Content */}
                <View className="items-center space-y-4">
                    <Text className="text-4xl text-center font-display-bold text-primary">
                        {steps[step].title}
                    </Text>
                    <Text className="max-w-xs text-lg text-center text-gray-500 font-display">
                        {steps[step].description}
                    </Text>
                </View>
            </View>

            {/* Bottom Section */}
            <View className="px-8 pb-8">
                {/* Dots Indicator */}
                <View className="flex-row items-center justify-center gap-2.5 mb-8">
                    {steps.map((_, i) => (
                        <View
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-gray-200'
                                }`}
                        />
                    ))}
                </View>

                {/* Next Button */}
                <Pressable
                    onPress={nextStep}
                    className="flex-row items-center justify-center w-full px-6 py-5 rounded-3xl bg-primary active:opacity-80"
                >
                    <Text className="text-xl text-white font-display-bold">
                        {step === steps.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <Text className="ml-2 text-lg text-white">
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </Text>
                </Pressable>
        </View>
        </SafeAreaView>
    )
}

export default OnboardingScreen