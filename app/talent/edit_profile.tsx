import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useHCStyles } from "@/contexts/ThemeContext";
import Toast from "@/components/Toast";
import { apiFetch, ApiError, toAbsoluteApiUrl } from "@/services/api";
import { clearAuthSession, getAccessToken } from "@/services/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export default function EditTalent() {
  const { id, currentName, currentPhotoUrl } = useLocalSearchParams<{
    id: string;
    currentName: string;
    currentPhotoUrl: string;
  }>();
  const router = useRouter();
  const s = useHCStyles();
  const [name, setName] = useState(currentName ?? "");
  const [photo, setPhoto] = useState<SelectedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAccessToken().then((token) => setAccessToken(token ?? ""));
  }, []);

  const pickFromLibrary = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
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
      setPhoto({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
    }
  };

  const takePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
    }
  };

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    if (photo) {
      formData.append("profile_photo", {
        uri: photo.uri,
        name: photo.fileName || "profile.jpg",
        type: photo.mimeType || "image/jpeg",
      } as unknown as Blob);
    }

    try {
      setLoading(true);
      await apiFetch(`/api/actors/${id}`, {
        method: "PUT",
        body: formData,
      });
      setSaved(true);
      setTimeout(() => router.back(), 1800);
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

  const existingPhotoUri = currentPhotoUrl
    ? toAbsoluteApiUrl(currentPhotoUrl)
    : "";

  return (
    <View className="flex-1 bg-white px-5" style={s.bg}>
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-semibold text-primary" style={s.text}>Edit Profile</Text>
      <Text className="text-gray-500 mt-1" style={s.subtext}>Update talent details</Text>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-6">
          <Text className="text-sm text-gray-500 mb-2" style={s.subtext}>Full Name</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Enter name"
            placeholderTextColor={s.subtext.color ?? "#9ca3af"}
            value={name}
            onChangeText={setName}
            style={[{
              height: 52,
              paddingVertical: 12,
              textAlignVertical: "center",
              fontSize: 16,
              lineHeight: 20,
            }, s.input]}
          />
        </View>

        <View className="mt-6">
          <Text className="text-sm text-gray-500 mb-3" style={s.subtext}>Profile Photo</Text>

          <View className="items-center mb-4">
            {photo ? (
              <>
                <Image
                  source={{ uri: photo.uri }}
                  className="w-40 h-40 rounded-full"
                />
                <Text className="text-xs text-gray-500 mt-2">New photo selected</Text>
              </>
            ) : existingPhotoUri ? (
              <>
                <ExpoImage
                  source={{
                    uri: existingPhotoUri,
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
                  }}
                  style={{ width: 160, height: 160, borderRadius: 80 }}
                  cachePolicy="none"
                />
                <Text className="text-xs text-gray-400 mt-2">Current photo</Text>
              </>
            ) : (
              <View
                className="bg-lightGray items-center justify-center"
                style={{ width: 160, height: 160, borderRadius: 80 }}
              >
                <Text className="text-gray-400 text-sm">No photo</Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={takePhoto}
              className="flex-1 bg-lightGray py-3 rounded-full items-center flex-row justify-center gap-2"
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={18} color="#374151" />
              <Text className="text-gray-700 font-semibold">Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromLibrary}
              className="flex-1 bg-lightGray py-3 rounded-full items-center flex-row justify-center gap-2"
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#374151" />
              <Text className="text-gray-700 font-semibold">Upload Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <Text className="text-red-600 text-base mt-4">{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={submit}
          className="mt-6 bg-darkBlue py-4 rounded-full items-center"
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-3 py-3 rounded-full items-center"
          activeOpacity={0.7}
        >
          <Text className="text-gray-500 font-semibold">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast message="Profile saved!" visible={saved} />
    </View>
  );
}
