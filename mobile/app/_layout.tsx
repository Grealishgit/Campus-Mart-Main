import Ionicons from "@expo/vector-icons/Ionicons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import "react-native-reanimated";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { subscribeToAuthTokenChanges } from "@/lib/apiClient";
import { initializeAuthSession } from "@/lib/authService";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    "Jost-Black": require("../assets/fonts/Jost-Black.ttf"),
    "Jost-Bold": require("../assets/fonts/Jost-Bold.ttf"),
    "Jost-Light": require("../assets/fonts/Jost-Light.ttf"),
    "Jost-Semibold": require("../assets/fonts/Jost-SemiBold.ttf"),
    "Jost-Medium": require("../assets/fonts/Jost-Medium.ttf"),
    "Jost-Regular": require("../assets/fonts/Jost-Regular.ttf"),
  });

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const { authenticated, role } = await initializeAuthSession();
      if (isMounted) {
        setIsAuth(authenticated);
        setUserRole(role ?? null);
      }
    };

    bootstrapAuth();

    const unsubscribe = subscribeToAuthTokenChanges(async (token) => {
      if (!isMounted) return;

      if (!token) {
        setIsAuth(false);
        setUserRole(null);
        return;
      }

      const { authenticated, role } = await initializeAuthSession();
      if (isMounted) {
        setIsAuth(authenticated);
        setUserRole(role ?? null);
      }
    });

    // const appStateSubscription = AppState.addEventListener(
    //   "change",
    //   (state) => {
    //     if (state === "active") {
    //       bootstrapAuth();
    //     }
    //   },
    // );

    return () => {
      isMounted = false;
      unsubscribe();
      // appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isAuth === null) return;

    const rootSegment = segments[0] as string | undefined;
    const secondSegment = String(segments[1] ?? "");
    const isAdminRoute = rootSegment === "admin";
    const isAdminLoginRoute = isAdminRoute && secondSegment === "login";
    const isInPublicRoute =
      rootSegment === "(auth)" || rootSegment === "(onboard)" || isAdminLoginRoute;

    if (isAuth) {
      // Wait until role is known before deciding where authenticated users should land.
      if (!userRole) return;

      if (isInPublicRoute) {
        if (userRole === "admin") {
          router.replace("/admin/dashboard" as never);
        } else {
          router.replace("/(tabs)" as never);
        }
        return;
      }

      // Prevent non-admin accounts from accessing admin screens.
      if (isAdminRoute && userRole !== "admin") {
        router.replace("/(tabs)" as never);
      }
      return;
    }

    if (isAdminRoute && !isAdminLoginRoute) {
      router.replace("/admin/login" as never);
      return;
    }

    if (!isInPublicRoute) {
      router.replace("/(auth)/SignIn" as never);
    }
  }, [isAuth, userRole, segments, router]);

  if (isAuth === null || !fontsLoaded)
    return (
      <View className="items-center justify-center flex-1 bg-primary">
        <Ionicons name="school" size={60} color="white" />
        <Text className="mb-3 text-4xl text-white font-display-bold">
          Campus Mart
        </Text>
        <ActivityIndicator size="large" color="white" />
      </View>
    );

  return (
    <ThemeProvider value={colorScheme === "light" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#ffffff" },
        }}
      >
        <Stack.Screen
          name="(onboard)"
          options={{ animation: "fade_from_bottom" }}
        />
        <Stack.Screen
          name="(auth)"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="(listing)"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen
          name="product-item/[id]"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="chats/chat"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="ai-chat/aichat"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="settings/settings"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="vendor/dashboard"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="vendor/incoming-orders"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="admin" options={{ animation: "slide_from_right" }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
