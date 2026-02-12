import { apiFetch, ApiError } from "@/services/api";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function RecoverProductionId() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const recoverId = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch(
        "/api/auth/recover-production-id",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        },
        { auth: false }
      );
      const data = await response.json();
      setMessage(
        typeof data?.message === "string"
          ? data.message
          : "If an account exists for that email, a recovery email has been sent."
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-5">
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-semibold text-primary mb-3">Recover Production ID</Text>
      <Text className="text-base text-gray-600 leading-6 mb-6">
        Before you do this check your inbox for when you set up the account.
      </Text>

      <Text className="text-sm text-gray-500 mb-2">Email</Text>
      <TextInput
        className="bg-lightGray rounded-2xl px-4"
        placeholder="Enter account email"
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

      <TouchableOpacity
        className="bg-darkBlue mt-6 py-4 rounded-full items-center"
        activeOpacity={0.85}
        onPress={recoverId}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-base font-semibold">Recover ID</Text>
        )}
      </TouchableOpacity>

      {error ? <Text className="text-red-600 text-base mt-4">{error}</Text> : null}
      {message ? <Text className="text-green-600 text-base mt-4">{message}</Text> : null}
    </View>
  );
}
