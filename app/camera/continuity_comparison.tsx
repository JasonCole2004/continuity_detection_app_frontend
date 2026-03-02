import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession, getAccessToken } from "@/services/auth";
import { API_URL } from "@/constants/api";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

type ContinuityPhoto = {
  id: number;
  scene_number?: string | null;
  scene_name?: string | null;
};

export default function ContinuityComparison() {
  const router = useRouter();
  const { annotatedImageUrl, talentId } = useLocalSearchParams<{
    annotatedImageUrl?: string;
    talentId?: string;
  }>();

  const [accessToken, setAccessToken] = useState<string>("");
  const [referencePhoto, setReferencePhoto] = useState<ContinuityPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then((token) => setAccessToken(token ?? ""));
  }, []);

  useEffect(() => {
    if (!talentId) {
      setLoading(false);
      return;
    }
    apiFetch(`/api/actors/${talentId}/photos`)
      .then((res) => res.json())
      .then((data) => {
        const photos: ContinuityPhoto[] = Array.isArray(data) ? data : [];
        setReferencePhoto(photos[0] ?? null);
      })
      .catch(async (err) => {
        if (err instanceof ApiError && err.status === 401) {
          await clearAuthSession();
          router.replace("/login");
          return;
        }
        setError("Could not load reference photo.");
      })
      .finally(() => setLoading(false));
  }, [talentId, router]);

  const normalizedAnnotated = annotatedImageUrl
    ? annotatedImageUrl.startsWith("http")
      ? annotatedImageUrl
      : `${API_URL}${annotatedImageUrl}`
    : "";

  const referenceUrl = referencePhoto
    ? `${API_URL}/api/photos/${referencePhoto.id}/image`
    : "";

  const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

  return (
    <View className="flex-1 bg-white">
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-6 px-5">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <Text className="text-2xl font-semibold text-primary mb-6">Photo Comparison</Text>

        <Text className="text-sm text-gray-500 mb-2">Reference (how it should look)</Text>
        {loading ? (
          <View className="w-full h-72 rounded-2xl bg-lightGray items-center justify-center mb-6">
            <ActivityIndicator color="#023E8A" />
          </View>
        ) : error ? (
          <View className="w-full h-72 rounded-2xl bg-lightGray items-center justify-center mb-6">
            <Text className="text-gray-400 text-sm">{error}</Text>
          </View>
        ) : referenceUrl ? (
          <Image
            source={{ uri: referenceUrl, headers: authHeaders }}
            style={{ width: "100%", height: 300, borderRadius: 16 }}
            contentFit="contain"
            cachePolicy="none"
            className="mb-6"
          />
        ) : (
          <View className="w-full h-72 rounded-2xl bg-lightGray items-center justify-center mb-6">
            <Text className="text-gray-400 text-sm">No reference photo saved yet</Text>
          </View>
        )}

        <Text className="text-sm text-gray-500 mb-2">Current check</Text>
        {normalizedAnnotated ? (
          <Image
            source={{ uri: normalizedAnnotated, headers: authHeaders }}
            style={{ width: "100%", height: 300, borderRadius: 16 }}
            contentFit="contain"
            cachePolicy="none"
          />
        ) : (
          <View className="w-full h-72 rounded-2xl bg-lightGray items-center justify-center">
            <Text className="text-gray-400 text-sm">No image available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
