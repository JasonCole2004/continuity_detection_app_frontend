import { useLocalSearchParams, useRouter } from "expo-router";
import { useHCStyles } from "@/contexts/ThemeContext";
import React, { useEffect, useState } from "react";
import { Alert, ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession, getAccessToken } from "@/services/auth";
import { API_URL } from "@/constants/api";

export default function PhotoDetails() {
  const router = useRouter();
  const s = useHCStyles();
  const { photoId, talentId, sceneLabel, notes } = useLocalSearchParams<{
    photoId?: string;
    talentId?: string;
    sceneLabel?: string;
    notes?: string;
  }>();
  const [deleting, setDeleting] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");

  useEffect(() => {
    getAccessToken().then((token) => setAccessToken(token ?? ""));
  }, []);

  const imageUrl = photoId ? `${API_URL}/api/photos/${photoId}/image` : "";

  const confirmDelete = () => {
    if (!photoId || deleting) return;
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deletePhoto },
      ],
      { cancelable: true }
    );
  };

  const deletePhoto = async () => {
    if (!photoId) return;
    try {
      setDeleting(true);
      await apiFetch(`/api/actors/${talentId}/photos/${photoId}`, {
        method: "DELETE",
      });
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearAuthSession();
        router.replace("/login");
        return;
      }
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-5" style={s.bg}>
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      {imageUrl ? (
        <Image
          source={{
            uri: imageUrl,
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          }}
          style={{ width: "100%", height: 360, borderRadius: 20 }}
          contentFit="contain"
          contentPosition="center"
          cachePolicy="none"
        />
      ) : (
        <View className="w-full h-[360px] rounded-2xl bg-lightGray items-center justify-center">
          <Text className="text-gray-400 text-base" style={s.subtext}>No image</Text>
        </View>
      )}

      <View className="mt-6">
        <Text className="text-2xl font-semibold text-primary" style={s.text}>
          Scene {sceneLabel ?? "Unknown"}
        </Text>
        <Text className="text-sm text-gray-500 mt-1" style={s.subtext}>Photo ID #{photoId ?? "N/A"}</Text>
      </View>

      <View className="mt-4">
        <Text className="text-sm text-gray-500 mb-2" style={s.subtext}>Notes</Text>
        <Text className="text-base text-primary" style={s.text}>
          {notes && notes.length > 0 ? notes : "No notes"}
        </Text>
      </View>

      <TouchableOpacity
        onPress={confirmDelete}
        className="mt-8 bg-red-600 py-4 rounded-full items-center"
        activeOpacity={0.8}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-semibold">Delete Photo</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
