import { images } from "@/constants/images";
import { clearAuthSession } from "@/services/auth";
import { useRouter } from "expo-router";
import React from "react";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

const Settings = () => {
  const router = useRouter();
  return (
    <View className="flex-1 bg-white">
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

      <View className="px-5 pt-6">
        <TouchableOpacity
          className="bg-lightGray px-5 py-4 rounded-2xl mb-3"
          activeOpacity={0.8}
          onPress={() => router.push("/settings/reset_password")}
        >
          <Text className="text-lg font-semibold text-primary">Reset Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-lightGray px-5 py-4 rounded-2xl mb-3"
          activeOpacity={0.8}
          onPress={() => router.push("/settings/contact_support")}
        >
          <Text className="text-lg font-semibold text-primary">Contact Support</Text>
        </TouchableOpacity>

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
