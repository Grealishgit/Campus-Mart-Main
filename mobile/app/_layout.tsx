import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import "../global.css"


import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();


  const [fontsLoaded] = useFonts({
    'Jost-Black': require('../assets/fonts/Jost-Black.ttf'),
    'Jost-Bold': require('../assets/fonts/Jost-Bold.ttf'),
    'Jost-Light': require('../assets/fonts/Jost-Light.ttf'),
    'Jost-Semibold': require('../assets/fonts/Jost-SemiBold.ttf'),
    'Jost-Medium': require('../assets/fonts/Jost-Medium.ttf'),
    'Jost-Regular': require('../assets/fonts/Jost-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(onboard)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
