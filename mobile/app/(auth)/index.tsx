import { View, Text, Pressable, TextInput } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

const SignUpScreen = () => {

    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);


    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        faculty: '',
        year: '',
        phone: '',
        password: ''
    });

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Pressable onPress={() => router.navigate('/(onboard)')}
                    className="items-center justify-center w-10 h-10 rounded-full active:bg-gray-100"
                >
                    <Ionicons name="chevron-back" size={24} color="black" />
                </Pressable>
                <Text className="flex-1 pr-10 text-3xl text-center font-display-bold">Sign Up</Text>
            </View>


            <View className="flex-1 px-4">
                {/* Title Section */}
                <View className="pt-6 pb-8">
                    <Text className="text-3xl text-center font-display-bold">Create Your Account</Text>
                    <Text className="mt-2 text-center text-gray-500 text-md font-display">Join thousands of students at your university.</Text>
                </View>

                {/* Form */}
                <View className="space-y-6">

                    <View className="space-y-2">
                        <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">Full Name</Text>
                        <View className="flex-row items-center bg-white border border-gray-400 rounded-xl">
                            <View className="pl-4">
                                <Ionicons name="person" size={20} color="#9ca3af" />
                            </View>
                            <TextInput
                                className="flex-1 p-4 pl-2 text-base font-display"
                                placeholder="e.g. John Doe"
                                value={formData.fullName}
                                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                            />
                        </View>
                    </View>

                    {/* University Email */}
                    <View className="mt-4 space-y-2">
                        <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">University Email</Text>
                        <View className="flex-row items-center bg-white border border-gray-400 rounded-xl">
                            <View className="pl-4">
                                <Ionicons name="school" size={20} color="#9ca3af" />
                            </View>
                            <TextInput
                                className="flex-1 p-4 pl-2 text-base font-display"
                                placeholder="john.doe@uonbi.ac.ke"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                            />
                        </View>
                        <Text className="mt-3 ml-1 font-medium text-md text-primary">Must end in .ac.ke or .edu</Text>
                    </View>

                    {/* Faculty and Year Row */}
                    <View className="flex-row gap-4 mt-4">
                        <View className="flex-1 space-y-2">
                            <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">Faculty</Text>
                            <View className="bg-white border border-gray-400 rounded-xl">
                                {/* You'll need a picker component here */}
                                <TextInput
                                    className="p-4 text-base font-display"
                                    placeholder="Select"
                                    value={formData.faculty}
                                    onChangeText={(text) => setFormData({ ...formData, faculty: text })}
                                />
                            </View>
                        </View>
                        <View className="flex-1 space-y-2">
                            <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">Year</Text>
                            <View className="bg-white border border-gray-400 rounded-xl">
                                <TextInput
                                    className="p-4 text-base font-display"
                                    placeholder="Year"
                                    value={formData.year}
                                    onChangeText={(text) => setFormData({ ...formData, year: text })}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Phone Number */}
                    <View className="mt-4 space-y-2">
                        <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">Phone Number</Text>
                        <View className="flex-row items-center bg-white border border-gray-400 rounded-xl">
                            <View className="flex-row items-center pl-4 pr-3 border-r border-gray-400">
                                <Text className="text-sm font-bold text-gray-500">+254</Text>
                            </View>
                            <TextInput
                                className="flex-1 p-4 pl-3 text-base font-display"
                                placeholder="712 345 678"
                                keyboardType="phone-pad"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View className="mt-5 space-y-2">
                        <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">Password</Text>
                        <View className="flex-row items-center bg-white border border-gray-400 rounded-xl">
                            <View className="pl-4">
                                <MaterialIcons name="password" size={24} color="#9ca3af" />
                            </View>
                            <TextInput
                                className="flex-1 p-4 pl-2 text-base font-display"
                                placeholder="••••••••"
                                secureTextEntry={!showPassword}
                                value={formData.password}
                                onChangeText={(text) => setFormData({ ...formData, password: text })}
                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                className="pr-4"
                            >
                                <Text className="text-xl text-gray-400">
                                    {<Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="#9ca3af" />}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Terms Checkbox */}
                    <Pressable
                        onPress={() => setAgreeToTerms(!agreeToTerms)}
                        className="flex-row items-start gap-3 px-1 py-2 mt-5"
                    >
                        <View className={`w-5 h-5 rounded border-2 items-center justify-center mt-0.5 ${agreeToTerms ? 'bg-primary border-primary' : 'border-gray-300'
                            }`}>
                            {agreeToTerms && <Text className="text-xs text-white">✓</Text>}
                        </View>
                        <Text className="flex-1 text-lg text-gray-600 font-display-medium">
                            I agree to the <Text className="font-semibold text-primary">Terms & Conditions</Text> and <Text className="font-semibold text-primary">Privacy Policy</Text>
                        </Text>
                    </Pressable>

                    {/* Create Account Button */}
                    <Pressable
                        className="flex-row items-center justify-center w-full gap-2 py-4 mt-4 bg-primary rounded-xl active:opacity-80"
                    >
                        <Text className="text-lg font-bold text-white">Create Account</Text>
                        <Ionicons name='arrow-forward' size={24} color="#ffffff" />
                    </Pressable>

                    {/* Sign In Link */}
                    <View className="flex-row items-center justify-center py-4 mt-3">
                        <Text className="text-lg text-gray-500 font-display">Already have an account? </Text>
                        <Pressable>
                            <Text className="text-xl font-display-bold text-primary">Sign In</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default SignUpScreen