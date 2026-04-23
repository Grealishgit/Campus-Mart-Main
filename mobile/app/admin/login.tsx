import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { loginAdmin } from "@/lib/authService";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleAdminLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter both admin email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginAdmin({
        email: email.trim(),
        password,
      });

      if (!response.success || response.data?.user?.role !== "admin") {
        Alert.alert(
          "Admin login failed",
          response.error || "This account does not have admin access.",
        );
        return;
      }

      router.replace("/admin/dashboard" as never);
    } catch {
      Alert.alert("Admin login failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 px-6 py-5">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.replace("/(auth)/SignIn" as never)}
            className="items-center justify-center rounded-full h-11 w-11 bg-white/10"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Text className="text-base uppercase tracking-[0.25em] text-cyan-300 font-display-bold">
            Admin Portal
          </Text>
        </View>

        <View className="mt-14 rounded-[28px] border border-white/10 bg-slate-900 p-6">
          <View className="mb-8">
            <Text className="text-3xl text-white font-display-bold">
              Separate admin sign-in
            </Text>
            <Text className="mt-3 text-base leading-6 text-slate-300 font-display">
              Admin access is isolated from student and vendor login. Use your
              admin credentials to manage the marketplace.
            </Text>
          </View>

          <Text className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400 font-display-semibold">
            Admin Email
          </Text>
          <View className="flex-row items-center px-4 mb-5 border rounded-2xl border-white/10 bg-slate-800">
            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
            <TextInput
              className="flex-1 px-3 py-4 text-white font-display"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="admin@campusmart.ac.ke"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400 font-display-semibold">
            Password
          </Text>
          <View className="flex-row items-center px-4 mb-6 border rounded-2xl border-white/10 bg-slate-800">
            <MaterialIcons name="password" size={22} color="#94a3b8" />
            <TextInput
              className="flex-1 px-3 py-4 text-white font-display"
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="default"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword((current) => !current)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#94a3b8"
              />
            </Pressable>
          </View>

          <Pressable
            onPress={handleAdminLogin}
            disabled={loading}
            className={`h-14 items-center justify-center rounded-2xl ${
              loading ? "bg-cyan-500/50" : "bg-cyan-500"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#082f49" />
            ) : (
              <Text className="text-lg text-slate-950 font-display-bold">
                Continue to dashboard
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(auth)/SignIn" as never)}
            className="items-center mt-5"
          >
            <Text className="text-sm text-slate-400 font-display-medium">
              Back to student/vendor login
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
