import TutorialModal from "@/components/TutorialModal";
import { useHCStyles } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";

export default function ContactSupport() {
  const router = useRouter();
  const s = useHCStyles();
  const [tutorialVisible, setTutorialVisible] = useState(false);

  return (
    <View className="flex-1 bg-white px-5" style={s.bg}>
      <TutorialModal visible={tutorialVisible} onClose={() => setTutorialVisible(false)} />

      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-semibold text-primary mb-6" style={s.text}>Contact Support</Text>

      <Text className="text-base text-gray-600 leading-7 mb-6" style={s.subtext}>
        If you're experiencing an issue or have a question, we're here to help. Before reaching out, we recommend checking the in-app tutorial — it covers the most common workflows and may answer your question quickly.
      </Text>

      <TouchableOpacity
        className="bg-lightGray px-5 py-4 rounded-2xl mb-4 flex-row items-center justify-center gap-3"
        activeOpacity={0.8}
        onPress={() => setTutorialVisible(true)}
        style={s.card}
      >
        <Ionicons name="play-circle-outline" size={22} color={s.text.color ?? "#023E8A"} />
        <Text className="text-base font-semibold text-primary" style={s.text}>Watch Tutorial</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-darkBlue px-5 py-4 rounded-2xl flex-row items-center justify-center gap-3"
        activeOpacity={0.8}
        onPress={() => Linking.openURL("mailto:cutsafe.app.bot@gmail.com")}
      >
        <Ionicons name="mail-outline" size={22} color="#fff" />
        <Text className="text-base font-semibold text-white">cutsafe.app.bot@gmail.com</Text>
      </TouchableOpacity>
    </View>
  );
}
