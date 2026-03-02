import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession, getAccessToken } from "@/services/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { API_URL } from "@/constants/api";

export default function ContinuityIssue() {
  const router = useRouter();
  const { annotatedImageUrl, message, regions, talentId, pendingToken, sceneNumber, notes } =
    useLocalSearchParams<{
      annotatedImageUrl?: string;
      message?: string;
      regions?: string;
      talentId?: string;
      pendingToken?: string;
      sceneNumber?: string;
      notes?: string;
    }>();
  const [accessToken, setAccessToken] = useState<string>("");
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

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

  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  const cleanedMessage = normalizedMessage
    .replace(/continuity issues?/gi, "")
    .replace(/detected/gi, "")
    .replace(/^[\s:,\-]+|[\s:,\-]+$/g, "");
  const bodyRegions = parsedRegions.filter(
    (region) =>
      region.trim().length > 0 &&
      region.trim().toLowerCase() !== normalizedMessage.toLowerCase()
  );
  const canOverride =
    typeof talentId === "string" &&
    talentId.trim().length > 0 &&
    typeof pendingToken === "string" &&
    pendingToken.trim().length > 0 &&
    typeof sceneNumber === "string" &&
    sceneNumber.trim().length > 0;

  const saveAnyway = async () => {
    if (!canOverride) {
      setOverrideError("Missing override data. Please retake and upload the photo.");
      return;
    }

    try {
      setOverrideError(null);
      setOverrideLoading(true);

      const formData = new FormData();
      formData.append("pending_token", pendingToken.trim());
      formData.append("scene_number", sceneNumber.trim());
      if (typeof notes === "string" && notes.trim()) {
        formData.append("notes", notes.trim());
      }

      await apiFetch(`/api/actors/${talentId.trim()}/photos/override`, {
        method: "POST",
        body: formData,
      });

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
          contentFit="contain"
          contentPosition="center"
          cachePolicy="none"
        />
      ) : (
        <View className="w-full h-[360px] rounded-2xl bg-lightGray items-center justify-center">
          <Text className="text-gray-400 text-base">No image available</Text>
        </View>
      )}

      <View className="mt-6">
        <Text className="text-2xl font-semibold text-primary">Continuity Issue</Text>
        <Text className="text-base text-red-600 mt-2">Spotted issues in:</Text>
        {bodyRegions.length > 0 ? (
          bodyRegions.map((region) => (
            <Text key={region} className="text-base text-red-600">
              - {region}
            </Text>
          ))
        ) : (
          <Text className="text-base text-red-600">- {cleanedMessage || "one or more body regions"}</Text>
        )}
      </View>

      <Text className="text-sm text-gray-500 mt-4">
        AI can be wrong. Please review manually and decide what to do with this photo.
      </Text>

      <TouchableOpacity
        className="mt-8 bg-darkBlue py-4 rounded-full items-center"
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/camera/continuity_comparison" as any,
            params: {
              annotatedImageUrl: annotatedImageUrl ?? "",
              talentId: talentId ?? "",
            },
          })
        }
      >
        <Text className="text-white text-base font-semibold">Compare Photos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-3 bg-red-700 py-4 rounded-full items-center"
        activeOpacity={0.85}
        onPress={() => router.replace("/")}
      >
        <Text className="text-white text-base font-semibold">Delete photo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`mt-3 py-4 rounded-full items-center ${
          canOverride ? "bg-green-700" : "bg-gray-400"
        }`}
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
    </View>
  );
}
