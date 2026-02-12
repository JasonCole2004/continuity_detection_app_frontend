import * as ImagePicker from "expo-image-picker";
import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession } from "@/services/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export default function NewActor() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<SelectedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFromLibrary = async () => {
    setError(null);
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPermission.granted) {
      setError("Photo library permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    }
  };

  const takePhoto = async () => {
    setError(null);
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      setError("Camera permission is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    }
  };

  const submit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Name, email, and phone are required.");
      return;
    }
    if (!photo) {
      setError("Profile photo is required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    formData.append("profile_photo", {
      uri: photo.uri,
      name: photo.fileName || "profile.jpg",
      type: photo.mimeType || "image/jpeg",
    } as unknown as Blob);

    try {
      setLoading(true);
      const response = await apiFetch("/api/actors", {
        method: "POST",
        body: formData,
      });
      await response.json();
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

      <Text className="text-3xl font-semibold text-primary">Add Actor</Text>
      <Text className="text-gray-500 mt-1">Create a new actor profile</Text>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-6">
          <Text className="text-sm text-gray-500 mb-2">Full Name</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Enter name"
            value={name}
            onChangeText={setName}
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
          <Text className="text-sm text-gray-500 mb-2">Email</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Enter email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
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
          <Text className="text-sm text-gray-500 mb-2">Phone</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Enter phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            style={{
              height: 52,
              paddingVertical: 12,
              textAlignVertical: "center",
              fontSize: 16,
              lineHeight: 20,
            }}
          />
        </View>

        <View className="mt-6">
          <Text className="text-sm text-gray-500 mb-3">Profile Photo</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={takePhoto}
              className="flex-1 bg-oceanBlue py-3 rounded-full items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold">Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromLibrary}
              className="flex-1 bg-oceanBlue py-3 rounded-full items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold">Upload Photo</Text>
            </TouchableOpacity>
          </View>

          {photo ? (
            <View className="mt-4 items-center">
              <Image
                source={{ uri: photo.uri }}
                className="w-40 h-40 rounded-full"
              />
              <Text className="text-xs text-gray-500 mt-2">Preview</Text>
            </View>
          ) : (
            <Text className="text-xs text-gray-400 mt-3 text-red">
              No photo selected yet
            </Text>
          )}
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
            <Text className="text-white text-base font-semibold">Save Actor</Text>
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
    </View>
  );
}
