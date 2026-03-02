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

  const ensureTalentExists = async () => {
    const response = await apiFetch("/api/actors", { method: "GET" });
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        "No talent has been added to this production yet. Please add a talent profile first."
      );
    }
  };

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
      const talentName = data?.actor_name ?? "Unknown";
      const talentId = data?.actor_id ?? "N/A";
      const profilePhotoUrl = data?.profile_photo_url ?? "";
      if (!match) {
        router.push({
          pathname: "/camera/manual_search",
          params: { photoUri: photo.uri },
        });
        return;
      }
      router.push({
        pathname: "/camera/facial_recognition_result",
        params: {
          match: "true",
          talentName: String(talentName),
          talentId: String(talentId),
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
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("no actor embeddings available")) {
        setError("No talent has been added to this production yet. Please add a talent profile first.");
        return;
      }
      router.push({
        pathname: "/camera/manual_search",
        params: { photoUri: photo.uri },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    setError(null);
    try {
      setLoading(true);
      await ensureTalentExists();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Something went wrong");
      return;
    } finally {
      setLoading(false);
    }

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
    try {
      setLoading(true);
      await ensureTalentExists();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Something went wrong");
      return;
    } finally {
      setLoading(false);
    }

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
        <Text className="mt-3 text-base text-red-600 text-center w-full">{error}</Text>
      ) : null}
    </View>
  );
};

export default CameraScreen;
