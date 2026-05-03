import { registerUser } from "@/lib/authService";
import { Ionicons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FACULTY_OPTIONS = [
  "Engineering",
  "Education",
  "Business",
  "Medicine",
  "Science",
  "Law",
  "Arts",
  "Agriculture",
  "Architecture",
  "ICT",
  "Other",
];

const YEAR_OPTIONS = Array.from({ length: 25 }, (_, index) =>
  String(2015 + index),
);

const LOCATION_OPTIONS = [
  "Kathemboni",
  "CP",
  "Katoloni",
  "Kathayoni",
  "Machakos CBD",
  "Kathale",
  "Eastleigh",
  "Kaseoni",
  "Kwa Mzee",
  "Diaspora"
]

type OptionPickerModalProps = {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

const OptionPickerModal = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: OptionPickerModalProps) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent
    onRequestClose={onClose}
  >
    <View className="justify-end flex-1 gap-2 bg-black/40">
      <View className="rounded-t-3xl bg-white px-4 pt-5 pb-6 max-h-[70%]">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl text-gray-800 font-display-bold">{title}</Text>
          <Pressable onPress={onClose} className="px-3 py-2 bg-gray-100 rounded-lg">
            <Text className="text-gray-700 font-display-medium">Close</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap gap-2">
            {options.map((option) => {
              const isSelected = selectedValue === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                  className={`rounded-xl flex-row gap-2 border px-4 py-3 ${isSelected ? "border-primary bg-primary/10" : "border-gray-200 bg-white"
                    }`}
                >
                  <Text
                    className={`text-base ${isSelected ? "text-primary font-display-semibold" : "text-gray-700 font-display"}`}
                  >
                    {option}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#6769ef" />}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const SignUpScreen = () => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facultyPickerOpen, setFacultyPickerOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [role, setRole] = useState<'student' | 'vendor'>('student');
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    faculty: string;
    year: string;
    phone: string;
    password: string;
    location: string;
  }>({
    fullName: "",
    email: "",
    faculty: "",
    year: "",
    phone: "",
    password: "",
    location: "",
  });

  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<typeof formData> = {};
    const normalizedPhone = formData.phone.replace(/\s+/g, "");

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (role === 'student' && !/^[^\s@]+@[^\s@]+\.(ac\.ke|edu)$/.test(formData.email))
      newErrors.email = "Must be a valid university email (.ac.ke or .edu).";
    else if (role === 'vendor' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Must be a valid email address.";

    if (role === 'student') {
      if (!formData.faculty.trim()) newErrors.faculty = "Faculty is required.";
    }

    if (role === 'vendor') {
      if (!formData.location.trim()) newErrors.location = "Location is required.";
    }

    if (!normalizedPhone.trim()) newErrors.phone = "Phone number is required.";
    else if (!/^[0-9]{9,13}$/.test(normalizedPhone))
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
      const normalizedPhone = formData.phone.replace(/\s+/g, "");
      const selectedYear = parseInt(formData.year, 10);

      const response = await registerUser({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role,
        faculty: role === 'student' ? formData.faculty || undefined : undefined,
        phone: normalizedPhone || undefined,
        location: role === 'vendor' ? formData.location || undefined : undefined,
      });

      if (response.success) {
        Alert.alert("Success", "Account created successfully!", [
          {
            text: "Continue",
            onPress: () => router.replace("/(tabs)"),
          },
        ]);
      } else {
        Alert.alert(
          "Registration Failed",
          response.error || "An error occurred during registration",
        );
        setError(response.error || "An error occurred during registration");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Registration error:", error);
      setError("An unexpected error occurred");
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
          Create Your Account
        </Text>
      </View>


      <ScrollView>

        <View className="flex-1 px-4">
          {/* Title Section */}
          <View className="pt-2 pb-4">
            <Text className="mt-2 text-xl text-center text-gray-500 font-display">
              Join thousands of students at your university.
            </Text>

          </View>

          {/* Form */}
          <View className="space-y-5">
            {/* Role Toggle */}
            <View className="flex-row p-1 mb-3 bg-gray-200 rounded-xl">
              {(['student', 'vendor'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  className={`flex-1 py-3 rounded-xl items-center ${role === r ? 'bg-primary py-2.5' : ''}`}
                >
                  <Text className={`text-base font-display-semibold capitalize ${role === r ? 'text-white' : 'text-gray-600'}`}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
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
                {role === 'student' ? " University Email" : "Email Address"}
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
                    {role === 'student' ? 'Must end in .ac.ke or .edu' : 'A valid email address'}
                </Text>
              )}
            </View>

            {/* Faculty and Year Row */}
            {role === 'student' && (
              <View className="flex-1 space-y-2">
                <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
                  Faculty
                </Text>
                <Pressable
                  onPress={() => setFacultyPickerOpen(true)}
                  className={`bg-white border rounded-xl ${errors.faculty ? "border-red-400" : "border-gray-400"}`}
                >
                  <View className="flex-row items-center justify-between p-4">
                    <Text
                      className={`text-base ${formData.faculty ? "text-gray-900 font-display" : "text-gray-400 font-display"}`}
                    >
                      {formData.faculty || "Select faculty"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6b7280" />
                  </View>
                </Pressable>
                {errors.faculty && (
                  <Text className="ml-1 text-sm text-red-500">
                    {errors.faculty}
                  </Text>
                )}
              </View>
            )}
            <View className="flex-row gap-4 mt-4">
              {role === 'vendor' && (
                <View className="flex-1 space-y-2">
                  <Text className="mb-3 ml-1 text-lg text-gray-700 font-display-medium">
                    Location
                  </Text>
                  <Pressable
                    onPress={() => setYearPickerOpen(true)}
                    className={`bg-white border rounded-xl ${errors.year ? "border-red-400" : "border-gray-400"}`}
                  >
                    <View className="flex-row items-center justify-between p-4">
                      <Text
                        className={`text-base ${formData.location ? "text-gray-900 font-display" : "text-gray-400 font-display"}`}
                      >
                        {formData.location || "Select location"}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color="#6b7280" />
                    </View>
                  </Pressable>

                </View>
              )}

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
                    setFormData({ ...formData, phone: text.replace(/[^0-9\s]/g, "") })
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

            {/* <Text className="mt-1 text-center text-red-500 text-md font-display">
              {error}
            </Text> */}

            {/* Terms Checkbox */}
            <Pressable
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              className="flex-row items-start gap-3 px-1 py-2 mt-5"
            >
              <View
                className={`w-5 h-5 rounded border-2 items-center justify-center mt-0.5 ${agreeToTerms ? "bg-primary border-primary" : "border-gray-300"
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
              className={`flex-row items-center justify-center w-full gap-2 py-4 mt-4 rounded-xl ${isLoading ? "bg-gray-400" : "bg-primary active:opacity-80"
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
              <Pressable onPress={() => router.navigate("/(auth)/login")}>
                <Text className="text-xl font-display-bold text-primary">
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <OptionPickerModal
          visible={facultyPickerOpen}
          title="Select Faculty"
          options={FACULTY_OPTIONS}
          selectedValue={formData.faculty}
          onClose={() => setFacultyPickerOpen(false)}
          onSelect={(value) => {
            setFormData({ ...formData, faculty: value });
            setErrors({ ...errors, faculty: undefined });
          }}
        />

        <OptionPickerModal
          visible={yearPickerOpen}
          title="Select Location"
          options={LOCATION_OPTIONS}
          selectedValue={formData.location}
          onClose={() => setYearPickerOpen(false)}
          onSelect={(value) => {
            setFormData({ ...formData, location: value });
            setErrors({ ...errors, location: undefined });
          }}
        />


      </ScrollView>


    </SafeAreaView>
  );
};

export default SignUpScreen;
