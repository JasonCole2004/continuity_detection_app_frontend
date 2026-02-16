import * as ImagePicker from "expo-image-picker";
import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession } from "@/services/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

const CameraScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendForIdentification = async (photo: SelectedImage) => {
    setError(null);
    setResultText(null);
    const formData = new FormData();
    formData.append("image", {
      uri: photo.uri,
      name: photo.fileName || "capture.jpg",
      type: photo.mimeType || "image/jpeg",
    } as unknown as Blob);

    try {
      setLoading(true);
      const response = await apiFetch("/api/face/identity", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const match = Boolean(data?.match);
      const actorName = data?.actor_name ?? "Unknown";
      const actorId = data?.actor_id ?? "N/A";
      const profilePhotoUrl = data?.profile_photo_url ?? "";
      router.push({
        pathname: "/camera/facial_recognition_result",
        params: {
          match: match ? "true" : "false",
          actorName: String(actorName),
          actorId: String(actorId),
          profilePhotoUrl: String(profilePhotoUrl),
          photoUri: photo.uri,
        },
      });
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

  const handleTakePhoto = async () => {
    setError(null);
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      setError("Camera permission is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await sendForIdentification({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    }
  };

  const handleUploadPhoto = async () => {
    setError(null);
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPermission.granted) {
      setError("Photo library permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await sendForIdentification({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    }
  };

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <TouchableOpacity
        className="w-full bg-darkBlue py-4 rounded-full items-center mb-4"
        activeOpacity={0.85}
        onPress={handleTakePhoto}
        disabled={loading}
      >
        <Text className="text-white text-base font-semibold">
          {loading ? "Working..." : "Take Photo"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="w-full bg-oceanBlue py-4 rounded-full items-center"
        activeOpacity={0.85}
        onPress={handleUploadPhoto}
        disabled={loading}
      >
        <Text className="text-white text-base font-semibold">Upload Photo</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator className="mt-6" color="#023E8A" />
      ) : null}

      {resultText ? (
        <Text className="mt-6 text-base text-primary">{resultText}</Text>
      ) : null}

      {error ? (
        <Text className="mt-3 text-base text-red-600">{error}</Text>
      ) : null}
    </View>
  );
};

export default CameraScreen;
