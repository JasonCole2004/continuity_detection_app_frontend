import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { getAccessToken } from "@/services/auth";
import './globals.css';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    Notifications.setNotificationChannelAsync("continuity", {
      name: "Continuity Alerts",
      importance: Notifications.AndroidImportance.HIGH,
    });

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as {
        type?: string;
        status?: string;
        annotatedImageUrl?: string;
        message?: string;
        regions?: string;
      };
      if (data?.type === "continuity_result" && data.status === "issues") {
        router.push({
          pathname: "/camera/continuity_check_result",
          params: {
            annotatedImageUrl: data.annotatedImageUrl ?? "",
            message: data.message ?? "",
            regions: data.regions ?? "",
          },
        });
        return;
      }
      router.replace("/");
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    return () => subscription.remove();
  }, [router]);

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
        name="actors/[id]"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="actors/new_profile"
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
        name="settings/contact_support"
        options={{ headerShown: false }}
    />
    <Stack.Screen
        name="settings/reset_password"
        options={{ headerShown: false }}
    />
  </Stack>;
}
