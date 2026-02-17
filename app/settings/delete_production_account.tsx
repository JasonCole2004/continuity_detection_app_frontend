import { apiFetch, ApiError } from "@/services/api";
import { clearAuthSession } from "@/services/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function DeleteProductionAccount() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performDeletion = async () => {
    setError(null);

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    try {
      setIsDeleting(true);
      await apiFetch("/api/productions/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      await clearAuthSession();
      router.replace("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const verifyDeletion = () => {
    Alert.alert(
      "Delete Production Account",
      "This action cannot be undone. Do you want to continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDeletion },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white px-5">
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-semibold text-primary">Delete Production Account</Text>
      <Text className="text-base text-gray-600 mt-2 mb-6">
        Enter your account password and verify deletion.
      </Text>

      <View className="mt-2">
        <Text className="text-sm text-gray-500 mb-2">Account Password</Text>
        <TextInput
          className="bg-lightGray rounded-2xl px-4"
          placeholder="Enter account password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={{
            height: 52,
            paddingVertical: 12,
            textAlignVertical: "center",
            fontSize: 16,
            lineHeight: 20,
          }}
        />
        <TouchableOpacity
          className="self-end mt-2"
          activeOpacity={0.85}
          onPress={() => setShowPassword((prev) => !prev)}
        >
          <Text className="text-darkBlue font-semibold">
            {showPassword ? "Hide" : "Show"} Password
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="mt-6 bg-red-600 py-4 rounded-full items-center"
        activeOpacity={0.85}
        onPress={verifyDeletion}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-semibold">Verify Deletion</Text>
        )}
      </TouchableOpacity>

      {error ? <Text className="text-red-600 text-base mt-4">{error}</Text> : null}
    </View>
  );
}
