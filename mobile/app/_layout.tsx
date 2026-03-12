import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import "../global.css"


import { useColorScheme } from '@/hooks/use-color-scheme';
import { View, Text, ActivityIndicator } from 'react-native';
import { useState } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [isAuthenticated, setIsAuthenticated] = useState(true);


  const [fontsLoaded] = useFonts({
    'Jost-Black': require('../assets/fonts/Jost-Black.ttf'),
    'Jost-Bold': require('../assets/fonts/Jost-Bold.ttf'),
    'Jost-Light': require('../assets/fonts/Jost-Light.ttf'),
    'Jost-Semibold': require('../assets/fonts/Jost-SemiBold.ttf'),
    'Jost-Medium': require('../assets/fonts/Jost-Medium.ttf'),
    'Jost-Regular': require('../assets/fonts/Jost-Regular.ttf'),
  });

  if (!isAuthenticated) return (
    <View className='items-center justify-center flex-1 bg-primary'>
      <Ionicons name='school' size={60} color='white' />
      <Text className='mb-3 text-4xl text-white font-display-bold'>Campus Mart</Text>
      <ActivityIndicator size='large' color='white' />
    </View>
  )

  if (!fontsLoaded) return (
    <View className='items-center justify-center flex-1 bg-primary'>
      <Ionicons name='school' size={60} color='white' />
      <Text className='mb-3 text-4xl text-white font-display-bold'>Campus Mart</Text>
    </View>
  )

  return (
    <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#ffffff" } }} >
        <Stack.Screen name="(onboard)" options={{ animation: "fade_from_bottom" }} />
        <Stack.Screen name="(auth)" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
