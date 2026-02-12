import { images } from "@/constants/images";
import { apiFetch, ApiError } from "@/services/api";
import { saveAuthSession } from "@/services/auth";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AuthMode = "login" | "create";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  const [productionId, setProductionId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setSuccess(null);

    if (!productionId.trim() || !password.trim()) {
      setError("Production ID and password are required.");
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            production_id: productionId.trim(),
            password,
          }),
        },
        { auth: false }
      );

      const data = await response.json();
      const accessToken = typeof data?.access_token === "string" ? data.access_token : "";
      if (!accessToken) {
        throw new Error("Invalid login response");
      }

      await saveAuthSession(accessToken, productionId.trim());
      router.replace("/(tabs)");
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

  const handleCreateAccount = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Email, password, and confirm password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch(
        "/api/productions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
        { auth: false }
      );

      const data = await response.json();
      const message =
        typeof data?.message === "string"
          ? data.message
          : "Production account created. Check your email for your production ID.";
      setSuccess(message);
      setMode("login");
      setPassword("");
      setConfirmPassword("");
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
    <ImageBackground source={images.backgroundImage} className="flex-1" resizeMode="cover">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-10 justify-center">
            <View className="items-center mb-2">
              <Image source={images.logo} style={{ width: 260, height: 260 }} />
            </View>

            <View className="flex-row bg-white/80 rounded-full p-1 mb-4">
              <TouchableOpacity
                className={`flex-1 rounded-full py-2 items-center ${mode === "login" ? "bg-darkBlue" : ""}`}
                onPress={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
                activeOpacity={0.85}
              >
                <Text className={mode === "login" ? "text-white font-semibold" : "text-primary"}>
                  Log In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-full py-2 items-center ${mode === "create" ? "bg-darkBlue" : ""}`}
                onPress={() => {
                  setMode("create");
                  setError(null);
                  setSuccess(null);
                }}
                activeOpacity={0.85}
              >
                <Text className={mode === "create" ? "text-white font-semibold" : "text-primary"}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              {mode === "login" ? (
                <TextInput
                  className="bg-white rounded-2xl px-4 text-base"
                  placeholder="Production ID"
                  value={productionId}
                  onChangeText={setProductionId}
                  placeholderTextColor="#6B7280"
                  keyboardType="number-pad"
                  style={{
                    height: 52,
                    paddingVertical: 12,
                    textAlignVertical: "center",
                    fontSize: 16,
                    lineHeight: 20,
                  }}
                />
              ) : (
                <TextInput
                  className="bg-white rounded-2xl px-4 text-base"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#6B7280"
                  style={{
                    height: 52,
                    paddingVertical: 12,
                    textAlignVertical: "center",
                    fontSize: 16,
                    lineHeight: 20,
                  }}
                />
              )}

              <TextInput
                className="bg-white rounded-2xl px-4 text-base"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#6B7280"
                style={{
                  height: 52,
                  paddingVertical: 12,
                  textAlignVertical: "center",
                  fontSize: 16,
                  lineHeight: 20,
                }}
              />

              {mode === "create" ? (
                <TextInput
                  className="bg-white rounded-2xl px-4 text-base"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor="#6B7280"
                  style={{
                    height: 52,
                    paddingVertical: 12,
                    textAlignVertical: "center",
                    fontSize: 16,
                    lineHeight: 20,
                  }}
                />
              ) : null}
            </View>

            <TouchableOpacity
              className="bg-darkBlue mt-4 py-4 rounded-full items-center"
              activeOpacity={0.85}
              onPress={mode === "login" ? handleLogin : handleCreateAccount}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  {mode === "login" ? "Log In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            {mode === "login" ? (
              <View className="mt-3 items-center gap-2">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/recover_production_id")}
                >
                  <Text className="text-white text-base font-semibold">Forgot production ID?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/reset_password")}
                >
                  <Text className="text-white text-base font-semibold">Forgot password?</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {error ? <Text className="text-red-500 text-base mt-4">{error}</Text> : null}
            {success ? <Text className="text-green-600 text-base mt-4">{success}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
