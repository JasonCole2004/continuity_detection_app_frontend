import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function ContactSupport() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-5">
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-semibold text-primary mb-4">Contact Support</Text>
      <Text className="text-base text-gray-600 leading-6">
        This is a prototype app. Contact support will be implemented at a later stage.
      </Text>
    </View>
  );
}
