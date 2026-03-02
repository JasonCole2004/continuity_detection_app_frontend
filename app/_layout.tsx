import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { getAccessToken } from "@/services/auth";
import './globals.css';

export default function RootLayout() {
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

  return <Stack initialRouteName="login">
    <Stack.Screen
      name="login"
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="recover_production_id"
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="reset_password"
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="(tabs)"
      options={{ headerShown: false }}
    />
    <Stack.Screen
        name="talent/[id]"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="talent/new_profile"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="camera/facial_recognition_result"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="camera/manual_search"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="camera/continuity_check"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="photos/[photoId]"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="camera/continuity_check_result"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="camera/continuity_comparison"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="settings/contact_support"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="settings/reset_password"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="settings/delete_production_account"
        options={{ headerShown: false }}
    />
  </Stack>;
}
