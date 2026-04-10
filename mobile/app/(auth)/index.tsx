import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { registerUser } from "@/lib/authService";

const SignUpScreen = () => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    faculty: string;
    year: string;
    phone: string;
    password: string;
  }>({
    fullName: "",
    email: "",
    faculty: "",
    year: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<typeof formData> = {};

    if (!formData.fullName.trim())
      newErrors.fullName = "Full name is required.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.(ac\.ke|edu)$/.test(formData.email))
      newErrors.email = "Must be a valid university email (.ac.ke or .edu).";

    if (!formData.faculty.trim()) newErrors.faculty = "Faculty is required.";

    if (!formData.year.trim()) newErrors.year = "Year of study is required.";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    else if (!/^\+?[0-9]{9,13}$/.test(formData.phone))
      newErrors.phone = "Enter a valid phone number.";

    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!agreeToTerms) {
      Alert.alert(
        "Terms & Conditions",
        "You must agree to the terms to continue.",
      );
      return;
    }
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Parse full name into first and last name
      const nameParts = formData.fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || formData.fullName;

      const response = await registerUser({
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        firstName,
        lastName,
      });

      if (response.success) {
        Alert.alert("Success", "Account created successfully! Please log in.", [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/SignIn"),
          },
        ]);
      } else {
        Alert.alert(
          "Registration Failed",
          response.error || "An error occurred during registration",
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Registration error:", error);
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
            Create Your Account
          </Text>
          <Text className="mt-2 text-center text-gray-500 text-md font-display">
            Join thousands of students at your university.
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-6">
          <View className="space-y-2">
            <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
              Full Name
            </Text>
            <View
              className={`flex-row items-center bg-white border rounded-xl ${errors.fullName ? "border-red-400" : "border-gray-400"}`}
            >
              <View className="pl-4">
                <Ionicons name="person" size={20} color="#9ca3af" />
              </View>
              <TextInput
                className="flex-1 p-4 pl-2 text-base font-display"
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullName: text })
                }
              />
            </View>
            {errors.fullName && (
              <Text className="ml-1 text-sm text-red-500">
                {errors.fullName}
              </Text>
            )}
          </View>

          {/* University Email */}
          <View className="mt-4 space-y-2">
            <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
              University Email
            </Text>
            <View
              className={`flex-row items-center bg-white border rounded-xl ${errors.email ? "border-red-400" : "border-gray-400"}`}
            >
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
              <Text className="ml-1 text-sm text-red-500">{errors.email}</Text>
            ) : (
              <Text className="mt-3 ml-1 font-medium text-md text-primary">
                Must end in .ac.ke or .edu
              </Text>
            )}
          </View>

          {/* Faculty and Year Row */}
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1 space-y-2">
              <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
                Faculty
              </Text>
              <View
                className={`bg-white border rounded-xl ${errors.faculty ? "border-red-400" : "border-gray-400"}`}
              >
                <TextInput
                  className="p-4 text-base font-display"
                  placeholder="Select"
                  value={formData.faculty}
                  onChangeText={(text) =>
                    setFormData({ ...formData, faculty: text })
                  }
                />
              </View>
              {errors.faculty && (
                <Text className="ml-1 text-sm text-red-500">
                  {errors.faculty}
                </Text>
              )}
            </View>
            <View className="flex-1 space-y-2">
              <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
                Year
              </Text>
              <View
                className={`bg-white border rounded-xl ${errors.year ? "border-red-400" : "border-gray-400"}`}
              >
                <TextInput
                  className="p-4 text-base font-display"
                  placeholder="Year"
                  value={formData.year}
                  onChangeText={(text) =>
                    setFormData({ ...formData, year: text })
                  }
                />
              </View>
              {errors.year && (
                <Text className="ml-1 text-sm text-red-500">{errors.year}</Text>
              )}
            </View>
          </View>

          {/* Phone Number */}
          <View className="mt-4 space-y-2">
            <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
              Phone Number
            </Text>
            <View
              className={`flex-row items-center bg-white border rounded-xl ${errors.phone ? "border-red-400" : "border-gray-400"}`}
            >
              <View className="flex-row items-center pl-4 pr-3 border-r border-gray-400">
                <Text className="text-sm font-bold text-gray-500">+254</Text>
              </View>
              <TextInput
                className="flex-1 p-4 pl-3 text-base font-display"
                placeholder="712 345 678"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, phone: text })
                }
              />
            </View>
            {errors.phone && (
              <Text className="ml-1 text-sm text-red-500">{errors.phone}</Text>
            )}
          </View>

          {/* Password */}
          <View className="mt-5 space-y-2">
            <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
              Password
            </Text>
            <View
              className={`flex-row items-center bg-white border rounded-xl ${errors.password ? "border-red-400" : "border-gray-400"}`}
            >
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
              <Text className="ml-1 text-sm text-red-500">
                {errors.password}
              </Text>
            )}
          </View>

          {/* Terms Checkbox */}
          <Pressable
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            className="flex-row items-start gap-3 px-1 py-2 mt-5"
          >
            <View
              className={`w-5 h-5 rounded border-2 items-center justify-center mt-0.5 ${
                agreeToTerms ? "bg-primary border-primary" : "border-gray-300"
              }`}
            >
              {agreeToTerms && <Text className="text-xs text-white">✓</Text>}
            </View>
            <Text className="flex-1 text-lg text-gray-600 font-display-medium">
              I agree to the{" "}
              <Text className="font-semibold text-primary">
                Terms & Conditions
              </Text>{" "}
              and{" "}
              <Text className="font-semibold text-primary">Privacy Policy</Text>
            </Text>
          </Pressable>

          {/* Create Account Button */}
          <Pressable
            onPress={handleSignUp}
            disabled={isLoading}
            className={`flex-row items-center justify-center w-full gap-2 py-4 mt-4 rounded-xl ${
              isLoading ? "bg-gray-400" : "bg-primary active:opacity-80"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text className="text-lg font-bold text-white">
                  Create Account
                </Text>
                <Ionicons name="arrow-forward" size={24} color="#ffffff" />
              </>
            )}
          </Pressable>

          {/* Sign In Link */}
          <View className="flex-row items-center justify-center py-4 mt-3">
            <Text className="text-lg text-gray-500 font-display">
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)/SignIn")}>
              <Text className="text-xl font-display-bold text-primary">
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignUpScreen;
