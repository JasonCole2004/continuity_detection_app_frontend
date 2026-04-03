import { images } from "@/constants/images";
import { clearAuthSession, getRole } from "@/services/auth";
import { useTheme } from "@/contexts/ThemeContext";
import TutorialModal from "@/components/TutorialModal";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ImageBackground, Switch, Text, TouchableOpacity, View } from "react-native";

const Settings = () => {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "crew" | null>(null);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const { highContrast, toggleHighContrast } = useTheme();

  useEffect(() => {
    getRole().then(setRole);
  }, []);

  const isAdmin = role === "admin";

  const hc = highContrast;
  const pageBg = hc ? "#000000" : "#ffffff";
  const cardBg = hc ? "#1a1a1a" : undefined;
  const cardText = hc ? "#ffffff" : undefined;

  return (
    <View className="flex-1 bg-white" style={{ backgroundColor: pageBg }}>
      <ImageBackground
        source={images.backgroundImage}
        className="w-full justify-end pb-2 px-5"
        style={{ height: 120 }}
        resizeMode="cover"
      >
        <Text style={{ fontStyle: "italic", fontSize: 40, fontWeight: "bold", color: "#fff" }}>
          Settings
        </Text>
      </ImageBackground>

      <TutorialModal visible={tutorialVisible} onClose={() => setTutorialVisible(false)} />
      <View className="px-5 pt-6">
        {isAdmin && (
          <>
            <TouchableOpacity
              className="bg-lightGray px-5 py-4 rounded-2xl mb-3"
              style={cardBg ? { backgroundColor: cardBg } : undefined}
              activeOpacity={0.8}
              onPress={() => router.push("/settings/reset_password")}
            >
              <Text className="text-lg font-semibold text-primary" style={cardText ? { color: cardText } : undefined}>Reset Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-lightGray px-5 py-4 rounded-2xl mb-3"
              style={cardBg ? { backgroundColor: cardBg } : undefined}
              activeOpacity={0.8}
              onPress={() => router.push("/settings/manage_crew" as never)}
            >
              <Text className="text-lg font-semibold text-primary" style={cardText ? { color: cardText } : undefined}>Manage Crew</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-lightGray px-5 py-4 rounded-2xl mb-3"
              style={cardBg ? { backgroundColor: cardBg } : undefined}
              activeOpacity={0.8}
              onPress={() => router.push("/settings/activity_log" as never)}
            >
              <Text className="text-lg font-semibold text-primary" style={cardText ? { color: cardText } : undefined}>Activity Log</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          className="bg-lightGray px-5 py-4 rounded-2xl mb-3"
          style={cardBg ? { backgroundColor: cardBg } : undefined}
          activeOpacity={0.8}
          onPress={() => router.push("/settings/contact_support")}
        >
          <Text className="text-lg font-semibold text-primary" style={cardText ? { color: cardText } : undefined}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-lightGray px-5 py-4 rounded-2xl mb-3"
          style={cardBg ? { backgroundColor: cardBg } : undefined}
          activeOpacity={0.8}
          onPress={() => setTutorialVisible(true)}
        >
          <Text className="text-lg font-semibold text-primary" style={cardText ? { color: cardText } : undefined}>Watch Tutorial</Text>
        </TouchableOpacity>

        <View
          className="bg-lightGray px-5 rounded-2xl mb-3 flex-row items-center justify-between"
          style={[{ paddingVertical: 14 }, cardBg ? { backgroundColor: cardBg } : undefined]}
        >
          <Text className="text-lg font-semibold text-primary" style={cardText ? { color: cardText } : undefined}>High Contrast</Text>
          <Switch
            value={highContrast}
            onValueChange={toggleHighContrast}
            trackColor={{ false: "#d1d5db", true: "#facc15" }}
            thumbColor={hc ? "#000000" : "#ffffff"}
          />
        </View>

        {isAdmin && (
          <TouchableOpacity
            className="bg-lightGray px-5 py-4 rounded-2xl mb-3"
            style={cardBg ? { backgroundColor: cardBg } : undefined}
            activeOpacity={0.8}
            onPress={() => router.push("/settings/delete_production_account" as never)}
          >
            <Text className="text-lg font-semibold text-red-600">Delete Production Account</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="bg-red-600 px-5 py-4 rounded-2xl"
          activeOpacity={0.8}
          onPress={async () => {
            await clearAuthSession();
            router.replace("/login");
          }}
        >
          <Text className="text-lg font-semibold text-white">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Settings;
