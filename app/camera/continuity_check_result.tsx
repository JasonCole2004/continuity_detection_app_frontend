import { useLocalSearchParams, useRouter } from "expo-router";
import { useHCStyles } from "@/contexts/ThemeContext";
import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession, getAccessToken } from "@/services/auth";
import { API_URL } from "@/constants/api";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

type ContinuityPhoto = {
  id: number;
  scene_number?: string | null;
};

export default function ContinuityIssue() {
  const router = useRouter();
  const s = useHCStyles();
  const { annotatedImageUrl, talentId, pendingToken, sceneNumber, notes } =
    useLocalSearchParams<{
      annotatedImageUrl?: string;
      talentId?: string;
      pendingToken?: string;
      sceneNumber?: string;
      notes?: string;
    }>();

  const [accessToken, setAccessToken] = useState<string>("");
  const [referencePhoto, setReferencePhoto] = useState<ContinuityPhoto | null>(null);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then((token) => setAccessToken(token ?? ""));
  }, []);

  useEffect(() => {
    if (!talentId) { setReferenceLoading(false); return; }
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
      })
      .finally(() => setReferenceLoading(false));
  }, [talentId, router]);

  const normalizedAnnotated = annotatedImageUrl
    ? annotatedImageUrl.startsWith("http") ? annotatedImageUrl : `${API_URL}${annotatedImageUrl}`
    : "";

  const referenceUrl = referencePhoto ? `${API_URL}/api/photos/${referencePhoto.id}/image` : "";
  const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

  const canOverride =
    typeof talentId === "string" && talentId.trim().length > 0 &&
    typeof pendingToken === "string" && pendingToken.trim().length > 0 &&
    typeof sceneNumber === "string" && sceneNumber.trim().length > 0;

  const saveAnyway = async () => {
    if (!canOverride) { setOverrideError("Missing override data. Please retake and upload the photo."); return; }
    try {
      setOverrideError(null);
      setOverrideLoading(true);
      const formData = new FormData();
      formData.append("pending_token", pendingToken.trim());
      formData.append("scene_number", sceneNumber.trim());
      if (typeof notes === "string" && notes.trim()) formData.append("notes", notes.trim());
      await apiFetch(`/api/actors/${talentId.trim()}/photos/override`, { method: "POST", body: formData });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearAuthSession();
        router.replace("/login");
        return;
      }
      setOverrideError(err instanceof Error ? err.message : "Failed to save photo override.");
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={s.bg}>
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-4 px-5">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <Text className="text-2xl font-semibold text-primary mb-6" style={s.text}>Continuity Issue</Text>

        <Text className="text-sm text-gray-500 mb-2" style={s.subtext}>Reference (how it should look)</Text>
        {referenceLoading ? (
          <View className="w-full h-72 rounded-2xl bg-lightGray items-center justify-center mb-6">
            <ActivityIndicator color="#023E8A" />
          </View>
        ) : referenceUrl ? (
          <Image
            source={{ uri: referenceUrl, headers: authHeaders }}
            style={{ width: "100%", height: 300, borderRadius: 16, marginBottom: 24 }}
            contentFit="contain"
            cachePolicy="none"
          />
        ) : (
          <View className="w-full h-72 rounded-2xl bg-lightGray items-center justify-center mb-6">
            <Text className="text-gray-400 text-sm" style={s.subtext}>No reference photo saved yet</Text>
          </View>
        )}

        <Text className="text-sm text-gray-500 mb-2" style={s.subtext}>Current photo</Text>
        {normalizedAnnotated ? (
          <Image
            source={{ uri: normalizedAnnotated, headers: authHeaders }}
            style={{ width: "100%", height: 300, borderRadius: 16 }}
            contentFit="contain"
            cachePolicy="none"
          />
        ) : (
          <View className="w-full h-72 rounded-2xl bg-lightGray items-center justify-center">
            <Text className="text-gray-400 text-sm" style={s.subtext}>No image available</Text>
          </View>
        )}

        <Text className="text-sm text-gray-500 mt-4 mb-6" style={s.subtext}>
          AI can be wrong. Please review manually and decide what to do with this photo.
        </Text>

        <TouchableOpacity
          className="bg-red-700 py-4 rounded-full items-center mb-3"
          activeOpacity={0.85}
          onPress={() => router.replace("/")}
        >
          <Text className="text-white text-base font-semibold">Delete photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`py-4 rounded-full items-center ${canOverride ? "bg-green-700" : "bg-gray-400"}`}
          activeOpacity={0.85}
          onPress={saveAnyway}
          disabled={overrideLoading || !canOverride}
        >
          {overrideLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Save anyway</Text>
          )}
        </TouchableOpacity>

        {overrideError ? (
          <Text className="text-red-600 text-base mt-3">{overrideError}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
