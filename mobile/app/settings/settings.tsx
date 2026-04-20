import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

export default function SettingsScreen() {
  const sections = [
    {
      title: "Vendor tools",
      items: [
        {
          label: "Vendor dashboard",
          description: "Track listings, verification status, and sales activity.",
          route: "/vendor/dashboard",
        },
        {
          label: "Incoming orders",
          description: "Handle buyer requests from your active listings.",
          route: "/vendor/incoming-orders",
        },
      ],
    },
    {
      title: "Admin tools",
      items: [
        {
          label: "Admin dashboard",
          description: "Open the marketplace control center.",
          route: "/admin/dashboard",
        },
        {
          label: "Admin login",
          description: "Use the separate admin sign-in flow.",
          route: "/admin/login",
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mb-8 mt-5 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-slate-100"
          >
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </Pressable>
          <View>
            <Text className="text-2xl text-slate-900 font-display-bold">
              Settings
            </Text>
            <Text className="text-slate-500 font-display">
              Marketplace management shortcuts.
            </Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-500 font-display-bold">
              {section.title}
            </Text>

            {section.items.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as never)}
                className="mb-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-lg text-slate-900 font-display-semibold">
                      {item.label}
                    </Text>
                    <Text className="mt-1 text-slate-500 font-display">
                      {item.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#0f172a" />
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
