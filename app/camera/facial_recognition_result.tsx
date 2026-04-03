import { useLocalSearchParams, useRouter } from "expo-router";
import { useHCStyles } from "@/contexts/ThemeContext";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { API_URL } from "@/constants/api";
import { getAccessToken } from "@/services/auth";

const CameraResult = () => {
  const router = useRouter();
  const s = useHCStyles();
  const { match, talentName, talentId, profilePhotoUrl, photoUri } = useLocalSearchParams<{
    match?: string;
    talentName?: string;
    talentId?: string;
    profilePhotoUrl?: string;
    photoUri?: string;
  }>();

  const isMatch = match === "true";
  const name = talentName ?? "Unknown";
  const id = talentId ?? "N/A";
  const [cacheKey] = useState(() => Date.now());
  const [accessToken, setAccessToken] = useState<string>("");

  useEffect(() => {
    getAccessToken().then((token) => setAccessToken(token ?? ""));
  }, []);

  const normalizedPhotoUrl = profilePhotoUrl
    ? profilePhotoUrl.startsWith("http")
      ? profilePhotoUrl
      : `${API_URL}${profilePhotoUrl}`
    : "";
  const photoUrlWithCache = normalizedPhotoUrl
    ? `${normalizedPhotoUrl}${normalizedPhotoUrl.includes("?") ? "&" : "?"}t=${cacheKey}`
    : "";

  return (
    <View className="flex-1 bg-white px-5" style={s.bg}>
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-1">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <View className="mt-6 items-center">
        {isMatch && photoUrlWithCache ? (
          <Image
            source={{
              uri: photoUrlWithCache,
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            }}
            style={{ width: 220, height: 220, borderRadius: 110 }}
            cachePolicy="none"
          />
        ) : null}
        <Text className="text-2xl font-semibold text-primary mt-6" style={s.text}>Is this:</Text>
        <Text className="text-3xl font-bold text-primary mt-2 text-center" style={s.text}>{name}</Text>
        <Text className="text-lg text-gray-500 mt-2 text-center" style={s.subtext}>ID #{id}</Text>
      </View>

      {!isMatch ? (
        <Text className="text-red-600 text-base mt-6">Nothing found</Text>
      ) : null}

      <View className="mt-10">
        {isMatch ? (
          <TouchableOpacity
            className="w-full bg-darkBlue py-4 rounded-full items-center mb-4"
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/camera/continuity_check",
                params: {
                  talentId: String(id),
                  talentName: String(name),
                  photoUri: String(photoUri ?? ""),
                },
              })
            }
          >
            <Text className="text-white text-base font-semibold">Yes</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          className="w-full bg-lightGray py-4 rounded-full items-center"
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/camera/manual_search",
              params: {
                photoUri: String(photoUri ?? ""),
              },
            })
          }
        >
          <Text className="text-black text-base font-semibold">
            {isMatch ? "No" : "Search Manually"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CameraResult;
