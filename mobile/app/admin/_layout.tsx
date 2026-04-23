import { Slot, router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { getCurrentUser } from "@/lib/authService";

export default function AdminLayout() {
  const pathname = usePathname();
  const isLoginScreen = pathname === "/admin/login";
  const [checkingAccess, setCheckingAccess] = useState(!isLoginScreen);

  useEffect(() => {
    if (isLoginScreen) {
      setCheckingAccess(false);
      return;
    }

    let mounted = true;

    const validateAccess = async () => {
      const response = await getCurrentUser();

      if (!mounted) {
        return;
      }

      if (!response.success || response.data?.role !== "admin") {
        router.replace("/admin/login" as never);
        return;
      }

      setCheckingAccess(false);
    };

    validateAccess();

    return () => {
      mounted = false;
    };
  }, [isLoginScreen]);

  if (checkingAccess) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <ActivityIndicator color="#ffffff" size="large" />
        <Text className="mt-4 text-center text-white font-display-medium">
          Checking admin access…
        </Text>
      </View>
    );
  }

  return <Slot />;
}
