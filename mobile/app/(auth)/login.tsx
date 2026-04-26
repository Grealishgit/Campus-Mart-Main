import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

import { loginUser } from "@/lib/authService";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const SignInScreen = () => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<{ email: string; password: string }>(
    {
      email: "",
      password: "",
    },
  );

  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<typeof formData> = {};

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.(ac\.ke|edu)$/.test(formData.email))
      newErrors.email = "Must be a valid university email (.ac.ke or .edu).";

    if (!formData.password) newErrors.password = "Password is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleLogin = async () => {
  if (!validate()) return;

  setIsLoading(true);
  try {
    const response = await loginUser({
      email: formData.email,
      password: formData.password,
    });

    if (response.success) {
      const user = response.data?.user;
      Alert.alert("Success", `Welcome back, ${user?.name}!`);
      console.log("Logged in user:", user?.role);

      // Route based on role
      if (user?.role === "admin") {
        router.replace("/admin/dashboard" as never);
      } else {
        router.replace("/(tabs)");
      }
    } else {
      Alert.alert(
        "Login Failed",
        response.error || "An error occurred during login",
      );
    }
  } catch (error) {
    Alert.alert("Error", "An unexpected error occurred");
    console.error("Login error:", error);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <Pressable
          onPress={() => router.navigate("/(onboard)")}
          className="items-center justify-center w-10 h-10 rounded-full active:bg-gray-100"
        >
          <Ionicons name="chevron-back" size={24} color="primary" />
        </Pressable>
        <Text className="flex-1 pr-10 text-3xl text-center text-primary font-display-bold">
          Campus Mart
        </Text>
      </View>

      <View className="flex-1 px-4">
        {/* Title Section */}
        <View className="pt-6 pb-8">
          <Text className="text-3xl text-center font-display-bold">
            Login Here
          </Text>
          <Text className="mt-2 text-center text-gray-500 text-md font-display">
            Login into your Account to Access resources
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-6">
          {/* University Email */}
          <View className="mt-4 space-y-2">
            <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
              University Email
            </Text>
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
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
              />
            </View>

            {errors.email ? (
              <Text className="mt-2 ml-1 text-sm text-red-500">
                {errors.email}
              </Text>
            ) : (
              <Text className="mt-3 ml-1 font-medium text-md text-primary">
                Your Yegistered School email must end in .ac.ke or .edu
              </Text>
            )}
          </View>

          {/* Password */}
          <View className="mt-5 space-y-2">
            <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
              Password
            </Text>
            <View className="flex-row items-center bg-white border border-gray-400 rounded-xl">
              <View className="pl-4">
                <MaterialIcons name="password" size={24} color="#9ca3af" />
              </View>
              <TextInput
                className="flex-1 p-4 pl-2 text-base font-display"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="pr-4"
              >
                <Text className="text-xl text-gray-400">
                  {
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={24}
                      color="#9ca3af"
                    />
                  }
                </Text>
              </Pressable>
            </View>

            {errors.password && (
              <Text className="mt-2 ml-1 text-sm text-red-500">
                {errors.password}
              </Text>
            )}
          </View>

          {/* Login Account Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className={`flex-row items-center justify-center w-full gap-2 py-4 mt-4 rounded-xl ${
              isLoading ? "bg-gray-400" : "bg-primary active:opacity-80"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text className="text-xl text-white font-display-bold">
                  Login
                </Text>
                <Ionicons name="arrow-forward" size={24} color="#ffffff" />
              </>
            )}
          </Pressable>

          {/* Sign In Link */}
          <View className="flex-row items-center justify-center py-4 mt-3">
            <Text className="text-lg text-gray-500 font-display">
              Don&apos;t have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)" as never)}>
              <Text className="text-xl font-display-bold text-primary">
                Sign Up
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignInScreen;
