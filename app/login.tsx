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
  Modal,
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
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

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
    if (!acceptedTerms) {
      setError("You must accept the Terms and Conditions.");
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
                secureTextEntry={!showPassword}
                placeholderTextColor="#6B7280"
                style={{
                  height: 52,
                  paddingVertical: 12,
                  textAlignVertical: "center",
                  fontSize: 16,
                  lineHeight: 20,
                }}
              />
              {mode === "login" ? (
                <TouchableOpacity
                  className="self-end -mt-2"
                  activeOpacity={0.85}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Text className="text-white text-sm font-semibold">
                    {showPassword ? "Hide" : "Show"} Password
                  </Text>
                </TouchableOpacity>
              ) : null}

              {mode === "create" ? (
                <>
                  <TextInput
                    className="bg-white rounded-2xl px-4 text-base"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#6B7280"
                    style={{
                      height: 52,
                      paddingVertical: 12,
                      textAlignVertical: "center",
                      fontSize: 16,
                      lineHeight: 20,
                    }}
                  />
                  <TouchableOpacity
                    className="self-end -mt-2"
                    activeOpacity={0.85}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <Text className="text-white text-sm font-semibold">
                      {showPassword ? "Hide" : "Show"} Password
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>

            {mode === "create" ? (
              <View className="mt-4">
                <View className="flex-row items-center flex-wrap">
                  <TouchableOpacity
                    className="flex-row items-center"
                    activeOpacity={0.85}
                    onPress={() => setAcceptedTerms((prev) => !prev)}
                  >
                    <View
                      className={`w-5 h-5 rounded border items-center justify-center mr-3 ${acceptedTerms ? "bg-darkBlue border-darkBlue" : "bg-white border-gray-400"}`}
                    >
                      {acceptedTerms ? <Text className="text-white text-xs font-bold">X</Text> : null}
                    </View>
                    <Text className="text-white text-base">I accept </Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => setTermsVisible(true)}>
                    <Text className="text-white text-base underline font-semibold">
                      Terms and Conditions
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

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

      <Modal
        animationType="slide"
        transparent
        visible={termsVisible}
        onRequestClose={() => setTermsVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-2xl p-5" style={{ maxHeight: 560 }}>
            <Text className="text-xl font-semibold text-primary mb-1">Terms and Conditions</Text>
            <Text className="text-sm text-gray-500 mb-4">Effective Date: February 17, 2026</Text>

            <ScrollView className="mb-4" showsVerticalScrollIndicator>
              <Text className="text-base text-gray-700 mb-3">
                By creating an account or using this app, you agree to these Terms and Conditions.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">1. Purpose of the App</Text>
              <Text className="text-base text-gray-700 mb-3">
                This app supports and speeds up film production workflows, including continuity and
                production support tasks.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">
                2. Actor Data and Storage
              </Text>
              <Text className="text-base text-gray-700 mb-3">
                Actor details and related production data are stored on a secure server with reasonable
                technical and organizational safeguards.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">3. Permitted Data Use</Text>
              <Text className="text-base text-gray-700 mb-3">
                You authorize the app to use submitted data, including actor-related data, to operate
                app features and improve its neural network model performance. Data use is limited to
                film-production functions and quality improvements only.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">
                4. No Harmful or Unrelated Use
              </Text>
              <Text className="text-base text-gray-700 mb-3">
                Data will not be used for unrelated commercial exploitation or harmful purposes,
                including malicious targeting, harassment, or misuse.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">
                5. AI Accuracy Disclaimer
              </Text>
              <Text className="text-base text-gray-700 mb-3">
                The app uses AI and machine-learning systems that may produce errors, omissions, false
                positives, false negatives, or inconsistent results.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">6. User Responsibility</Text>
              <Text className="text-base text-gray-700 mb-3">
                AI outputs are assistive only. You are responsible for reviewing outputs and making
                final production decisions.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">
                7. Limitation of Liability
              </Text>
              <Text className="text-base text-gray-700 mb-3">
                To the maximum extent permitted by law, the app and its operators are not liable for
                losses, continuity issues, delays, costs, or damages arising from app use or AI outputs.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">8. Account Security</Text>
              <Text className="text-base text-gray-700 mb-3">
                You are responsible for maintaining the confidentiality of your account credentials and
                activities under your account.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">
                9. Data Rights and Deletion
              </Text>
              <Text className="text-base text-gray-700 mb-3">
                You may request deletion of your production account and associated data through available
                app controls or support channels, subject to legal or operational retention requirements.
              </Text>

              <Text className="text-base font-semibold text-primary mb-1">10. Changes to Terms</Text>
              <Text className="text-base text-gray-700 mb-1">
                These Terms may be updated from time to time. Continued use of the app after updates
                means you accept the revised Terms.
              </Text>
            </ScrollView>
            <TouchableOpacity
              className="bg-darkBlue py-3 rounded-full items-center"
              activeOpacity={0.85}
              onPress={() => setTermsVisible(false)}
            >
              <Text className="text-white text-base font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}
