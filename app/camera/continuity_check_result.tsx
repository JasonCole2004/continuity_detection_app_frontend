import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { API_URL } from "@/constants/api";
import { getAccessToken } from "@/services/auth";

export default function ContinuityIssue() {
  const router = useRouter();
  const { annotatedImageUrl, message, regions } = useLocalSearchParams<{
    annotatedImageUrl?: string;
    message?: string;
    regions?: string;
  }>();
  const [accessToken, setAccessToken] = useState<string>("");

  useEffect(() => {
    getAccessToken().then((token) => setAccessToken(token ?? ""));
  }, []);

  const normalizedUrl = annotatedImageUrl
    ? annotatedImageUrl.startsWith("http")
      ? annotatedImageUrl
      : `${API_URL}${annotatedImageUrl}`
    : "";

  let parsedRegions: string[] = [];
  try {
    parsedRegions = regions ? JSON.parse(regions) : [];
  } catch {
    parsedRegions = [];
  }

  return (
    <View className="flex-1 bg-white px-5">
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      {normalizedUrl ? (
        <Image
          source={{
            uri: normalizedUrl,
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          }}
          style={{ width: "100%", height: 360, borderRadius: 20 }}
          cachePolicy="none"
        />
      ) : (
        <View className="w-full h-[360px] rounded-2xl bg-lightGray items-center justify-center">
          <Text className="text-gray-400 text-base">No image available</Text>
        </View>
      )}

      <View className="mt-6">
        <Text className="text-2xl font-semibold text-primary">Continuity Issue</Text>
        {message ? (
          <Text className="text-base text-red-600 mt-2">{message}</Text>
        ) : null}
      </View>

      {parsedRegions.length > 0 ? (
        <View className="mt-4">
          <Text className="text-sm text-gray-500 mb-2">Detected Regions</Text>
          {parsedRegions.map((region) => (
            <Text key={region} className="text-base text-primary">
              {region}
            </Text>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        className="mt-8 bg-darkBlue py-4 rounded-full items-center"
        activeOpacity={0.85}
        onPress={() => router.replace("/")}
      >
        <Text className="text-white text-base font-semibold">Return Home</Text>
      </TouchableOpacity>
    </View>
  );
}
