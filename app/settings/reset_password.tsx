import { apiFetch, ApiError } from "@/services/api";
import { useHCStyles } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResetPassword() {
  const router = useRouter();
  const s = useHCStyles();
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const requestCode = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setRequestingCode(true);
      const response = await apiFetch(
        "/api/auth/reset-password/request",
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
          : "If an account exists for that email, a reset code has been sent."
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setRequestingCode(false);
    }
  };

  const submitReset = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim() || !resetCode.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("All fields are required.");
      return;
    }
    if (!/^\d{6}$/.test(resetCode.trim())) {
      setError("Reset code must be a 6-digit code.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmittingReset(true);
      const response = await apiFetch(
        "/api/auth/reset-password/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            reset_code: resetCode.trim(),
            new_password: newPassword,
          }),
        },
        { auth: false }
      );
      const data = await response.json();
      setMessage(typeof data?.message === "string" ? data.message : "Password reset successful.");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-5" style={s.bg}>
      <TouchableOpacity onPress={() => router.back()} className="mt-20 mb-8">
        <Text className="text-darkBlue text-xl font-semibold">&larr; Back</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-semibold text-primary" style={s.text}>Reset Password</Text>
      <Text className="text-base text-gray-600 mt-2 mb-6" style={s.subtext}>
        Request a 6-digit reset code by email, then enter your new password.
      </Text>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mt-2">
          <Text className="text-sm text-gray-500 mb-2" style={s.subtext}>Email</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Enter account email"
            placeholderTextColor={s.subtext.color ?? "#9ca3af"}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[{
              height: 52,
              paddingVertical: 12,
              textAlignVertical: "center",
              fontSize: 16,
              lineHeight: 20,
            }, s.input]}
          />
        </View>

        <TouchableOpacity
          className="mt-4 bg-lightGray py-4 rounded-full items-center flex-row justify-center gap-2"
          activeOpacity={0.85}
          onPress={requestCode}
          disabled={requestingCode}
        >
          {requestingCode ? (
            <ActivityIndicator color="#374151" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={18} color="#374151" />
              <Text className="text-gray-700 text-base font-semibold">Send Reset Code</Text>
            </>
          )}
        </TouchableOpacity>

        <View className="mt-8">
          <Text className="text-sm text-gray-500 mb-2" style={s.subtext}>Reset Code</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Enter 6-digit code"
            placeholderTextColor={s.subtext.color ?? "#9ca3af"}
            value={resetCode}
            onChangeText={(text) => setResetCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
            keyboardType="number-pad"
            style={[{
              height: 52,
              paddingVertical: 12,
              textAlignVertical: "center",
              fontSize: 16,
              lineHeight: 20,
            }, s.input]}
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm text-gray-500 mb-2" style={s.subtext}>New Password</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Enter new password"
            placeholderTextColor={s.subtext.color ?? "#9ca3af"}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={[{
              height: 52,
              paddingVertical: 12,
              textAlignVertical: "center",
              fontSize: 16,
              lineHeight: 20,
            }, s.input]}
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm text-gray-500 mb-2" style={s.subtext}>Confirm Password</Text>
          <TextInput
            className="bg-lightGray rounded-2xl px-4"
            placeholder="Re-enter new password"
            placeholderTextColor={s.subtext.color ?? "#9ca3af"}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={[{
              height: 52,
              paddingVertical: 12,
              textAlignVertical: "center",
              fontSize: 16,
              lineHeight: 20,
            }, s.input]}
          />
        </View>

        <TouchableOpacity
          className="mt-6 bg-darkBlue py-4 rounded-full items-center"
          activeOpacity={0.85}
          onPress={submitReset}
          disabled={submittingReset}
        >
          {submittingReset ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Reset Password</Text>
          )}
        </TouchableOpacity>

        {error ? <Text className="text-red-600 text-base mt-4">{error}</Text> : null}
        {message ? <Text className="text-green-600 text-base mt-4">{message}</Text> : null}
      </ScrollView>
    </View>
  );
}
