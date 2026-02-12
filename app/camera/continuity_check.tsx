import { useLocalSearchParams, useRouter } from "expo-router";
import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession } from "@/services/auth";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Notifications from "expo-notifications";
const MAX_NOTES_LENGTH = 200;

type ContinuityResult = {
  overall_changed?: boolean;
  message?: string;
  error?: string;
  regions?: Record<string, unknown>;
};

export default function ContinuityCheck() {
  const router = useRouter();
  const { actorId, actorName, photoUri } = useLocalSearchParams<{
    actorId?: string;
    actorName?: string;
    photoUri?: string;
  }>();

  const [sceneNumber, setSceneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildIssues = (continuity: ContinuityResult) => {
    const nextIssues: string[] = [];
    if (continuity.error) {
      nextIssues.push(continuity.error);
      return nextIssues;
    }
    if (continuity.overall_changed) {
      if (continuity.regions && typeof continuity.regions === "object") {
        Object.entries(continuity.regions).forEach(([key, value]) => {
          if (value === true) {
            nextIssues.push(key);
          } else if (typeof value === "string") {
            nextIssues.push(`${key}: ${value}`);
          } else if (value && typeof value === "object" && (value as { changed?: boolean }).changed) {
            nextIssues.push(key);
          }
        });
      }
      if (nextIssues.length === 0) {
        nextIssues.push(continuity.message || "Continuity issue detected");
      }
    }
    return nextIssues;
  };

  const requestNotifications = async () => {
    const permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted) {
      await Notifications.requestPermissionsAsync();
    }
  };

  const notifyResult = async (payload: {
    status: "success" | "issues" | "error";
    message: string;
    annotatedImageUrl?: string;
    regions?: string[];
  }) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.status === "success" ? "Continuity OK" : "Continuity Issue",
        body: payload.message,
        sound: "default",
        data: {
          type: "continuity_result",
          status: payload.status,
          annotatedImageUrl: payload.annotatedImageUrl ?? "",
          message: payload.message,
          regions: JSON.stringify(payload.regions ?? []),
        },
      },
      trigger: null,
    });
  };

  const submit = async () => {
    setError(null);

    if (!sceneNumber.trim()) {
      setError("Scene number is required.");
      return;
    }
    if (!actorId) {
      setError("Actor ID is missing.");
      return;
    }
    if (!photoUri) {
      setError("Photo is missing. Please go back and try again.");
      return;
    }

    const formData = new FormData();
    formData.append("scene_number", sceneNumber.trim());
    if (notes.trim()) {
      formData.append("notes", notes.trim());
    }
    formData.append("image", {
      uri: photoUri,
      name: "continuity.jpg",
      type: "image/jpeg",
    } as unknown as Blob);

    try {
      setLoading(true);
      const response = await apiFetch(`/api/actors/${actorId}/photos`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const continuity = (data?.continuity ?? {}) as ContinuityResult;

      await requestNotifications();

      if (continuity.error) {
        await notifyResult({
          status: "error",
          message: continuity.error,
        });
        router.replace("/");
        return;
      }

      if (continuity.overall_changed === false) {
        await notifyResult({
          status: "success",
          message: "No errors found",
        });
        router.replace("/");
        return;
      }

      const nextIssues = buildIssues(continuity);
      await notifyResult({
        status: "issues",
        message: nextIssues.length > 0 ? nextIssues.join(", ") : "Continuity issue detected",
        annotatedImageUrl: data?.annotated_image_url ?? "",
        regions: nextIssues,
      });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearAuthSession();
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-5">
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-semibold text-primary mb-2">
        Scene Details
      </Text>
      {actorName ? (
        <Text className="text-base text-gray-500 mb-6">
          {actorName} (ID #{actorId})
        </Text>
      ) : null}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mt-2">
          <Text className="text-sm text-gray-500 mb-2">Scene Number</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Enter scene number"
            value={sceneNumber}
            onChangeText={(text) => setSceneNumber(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            style={{
              height: 52,
              paddingVertical: 12,
              textAlignVertical: "center",
              fontSize: 16,
              lineHeight: 20,
            }}
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm text-gray-500 mb-2">Notes (optional)</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Add notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            maxLength={MAX_NOTES_LENGTH}
            textAlignVertical="top"
            style={{
              height: 96,
              paddingVertical: 12,
              fontSize: 16,
              lineHeight: 20,
            }}
            scrollEnabled
          />
          <Text className="text-xs text-gray-500 mt-2 text-right">
            {notes.length}/{MAX_NOTES_LENGTH}
          </Text>
        </View>

        {error ? (
          <Text className="text-red-600 text-base mt-4">{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={submit}
          className="mt-6 bg-darkBlue py-4 rounded-full items-center"
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Upload</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
