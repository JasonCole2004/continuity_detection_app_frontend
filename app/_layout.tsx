import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { getAccessToken } from "@/services/auth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import './globals.css';

function AppNavigator() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken();
      if (token) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <Stack
      initialRouteName="login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="recover_production_id" />
      <Stack.Screen name="reset_password" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="talent/[id]" />
      <Stack.Screen name="talent/new_profile" />
      <Stack.Screen name="talent/edit_profile" />
      <Stack.Screen name="camera/facial_recognition_result" />
      <Stack.Screen name="camera/manual_search" />
      <Stack.Screen name="camera/continuity_check" />
      <Stack.Screen name="photos/[photoId]" />
      <Stack.Screen name="camera/continuity_check_result" />
      <Stack.Screen name="camera/continuity_comparison" />
      <Stack.Screen name="settings/contact_support" />
      <Stack.Screen name="settings/reset_password" />
      <Stack.Screen name="settings/delete_production_account" />
      <Stack.Screen name="settings/manage_crew" />
      <Stack.Screen name="settings/activity_log" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
