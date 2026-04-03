import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useHCStyles } from "@/contexts/ThemeContext";
import { Talent } from "@/interfaces/Talent";
import { apiFetch, ApiError, toAbsoluteApiUrl } from "@/services/api";
import { clearAuthSession, getAccessToken } from "@/services/auth";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

type ContinuityPhoto = {
  id: number;
  scene_name?: string | null;
  scene_number?: string | null;
  notes?: string | null;
  image_path?: string | null;
};

const TalentDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const s = useHCStyles();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [photos, setPhotos] = useState<ContinuityPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");

  const fetchTalent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/actors/${id}`);
      const data = await response.json();
      setTalent(data);
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
  }, [id, router]);

  const fetchPhotos = useCallback(async () => {
    try {
      setPhotosLoading(true);
      const response = await apiFetch(`/api/actors/${id}/photos`);
      const data = await response.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearAuthSession();
        router.replace("/login");
        return;
      }
      setPhotosError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPhotosLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      fetchTalent();
      setImageError(false);
    }, [fetchTalent])
  );

  useFocusEffect(
    useCallback(() => {
      fetchPhotos();
    }, [fetchPhotos])
  );

  useEffect(() => {
    getAccessToken().then((token) => setAccessToken(token ?? ""));
  }, []);

  const confirmDelete = () => {
    if (deleting) return;
    Alert.alert(
      "Delete Profile",
      "Are you sure you want to delete this profile?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteTalent },
      ],
      { cancelable: true }
    );
  };

  const deleteTalent = async () => {
    try {
      setDeleting(true);
      await apiFetch(`/api/actors/${id}`, {
        method: "DELETE",
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
      setDeleting(false);
    }
  };

  const navigateToContCheck = (uri: string) => {
    router.push({
      pathname: "/camera/continuity_check",
      params: {
        talentId: String(talent!.id),
        talentName: talent!.name,
        photoUri: uri,
      },
    });
  };

  const addContPhoto = () => {
    Alert.alert("Add Continuity Photo", "Choose a source", [
      {
        text: "Take Photo",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission required", "Camera access is needed.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.9 });
          if (!result.canceled && result.assets[0]) navigateToContCheck(result.assets[0].uri);
        },
      },
      {
        text: "Upload from Library",
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission required", "Photo library access is needed.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9 });
          if (!result.canceled && result.assets[0]) navigateToContCheck(result.assets[0].uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#023E8A" />
      </View>
    );
  }

  if (error || !talent) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-red-500 text-base mb-4">{error ?? "Talent not found"}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-darkBlue px-6 py-3 rounded-full">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const addCacheBuster = (url: string, token: string) => {
    if (!url) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${encodeURIComponent(token)}`;
  };

  const profilePhotoUri = talent.profile_photo_url
    ? addCacheBuster(
        toAbsoluteApiUrl(talent.profile_photo_url),
        `${talent.id}`
      )
    : "";

  return (
    <ScrollView
      className="flex-1 bg-white px-5"
      style={s.bg}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <View className="items-center mb-8">
        {profilePhotoUri && !imageError ? (
          <Image
            source={{
              uri: profilePhotoUri,
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            }}
            style={{ width: 220, height: 220, borderRadius: 110 }}
            cachePolicy="none"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="items-center justify-center bg-lightGray" style={{ width: 220, height: 220, borderRadius: 110 }}>
            <Text className="text-gray-400 text-sm">No photo</Text>
          </View>
        )}
      </View>

      <Text className="text-3xl font-bold text-primary mb-8" style={s.text}>{talent.name}</Text>

      <View className="bg-lightGray p-5 rounded-2xl" style={s.card}>
        <View>
          <Text className="text-sm text-gray-400 mb-1" style={s.subtext}>ID</Text>
          <Text className="text-lg text-primary" style={s.text}>#{talent.id}</Text>
        </View>
      </View>

      <View className="mt-8">
        <Text className="text-2xl font-semibold text-primary mb-4" style={s.text}>Continuity Photos</Text>
        {photosLoading ? (
          <ActivityIndicator size="small" color="#023E8A" />
        ) : photosError ? (
          <Text className="text-red-500 text-base">{photosError}</Text>
        ) : photos.length === 0 ? (
          <Text className="text-gray-400 text-base">No photos yet</Text>
        ) : (
          photos.map((photo) => {
            const sceneLabel = photo.scene_name || photo.scene_number || "Unknown scene";
            return (
              <TouchableOpacity
                key={photo.id}
                className="bg-lightGray p-4 rounded-2xl mb-3"
                style={s.card}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/photos/[photoId]",
                    params: {
                      photoId: String(photo.id),
                      talentId: String(talent.id),
                      sceneLabel: String(sceneLabel),
                      notes: String(photo.notes ?? ""),
                    },
                  })
                }
              >
                <Text className="text-lg font-semibold text-primary" style={s.text}>
                  Scene {sceneLabel}
                </Text>
                <Text className="text-sm text-gray-500 mt-1" style={s.subtext}>Photo ID #{photo.id}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <TouchableOpacity
        onPress={addContPhoto}
        className="mt-10 bg-lightGray py-4 rounded-full items-center flex-row justify-center gap-2"
        activeOpacity={0.8}
      >
        <Ionicons name="camera-outline" size={20} color="#374151" />
        <Text className="text-gray-700 text-base font-semibold">Take Continuity Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/talent/edit_profile",
            params: {
              id: String(talent.id),
              currentName: talent.name,
              currentPhotoUrl: talent.profile_photo_url ?? "",
            },
          })
        }
        className="mt-3 bg-darkBlue py-4 rounded-full items-center"
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-semibold">Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={confirmDelete}
        className="mt-3 mb-10 bg-red-600 py-4 rounded-full items-center"
        activeOpacity={0.8}
        disabled={deleting}
      >
        <Text className="text-white text-base font-semibold">
          {deleting ? "Deleting..." : "Delete Profile"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TalentDetails;
