import { Stack, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const OnboardingLayout = () => {
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const check = async () => {
            const onboarded = await AsyncStorage.getItem('onboarded');
            if (onboarded === 'true') {
                router.replace('/(auth)/login' as never);
            } else {
                setChecked(true);
            }
      };
      check();
  }, []);

    if (!checked) return null; // show nothing while checking

    return <Stack screenOptions={{ headerShown: false }} />;
};

export default OnboardingLayout;