import { images } from "@/constants/images";
import { apiFetch, ApiError } from "@/services/api";
import { checkAndClearSessionExpired, saveAuthSession } from "@/services/auth";
import {
  authenticateWithBiometrics,
  clearBiometricCredentials,
  getBiometricLabel,
  hasSavedBiometricCredentials,
  isBiometricAvailable,
  loadBiometricCredentials,
  saveBiometricCredentials,
} from "@/services/biometrics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type Tab = "crew" | "admin";
type CrewStep = "code" | "set-password" | "enter-password";
type AdminStep = "login" | "create";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SYMBOL_RE = /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/;

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!SYMBOL_RE.test(password)) return "Password must contain at least one symbol (e.g. !, @, #).";
  return null;
}

const inputStyle = {
  height: 52,
  paddingVertical: 12,
  textAlignVertical: "center" as const,
  fontSize: 16,
  lineHeight: 20,
};

export default function Login() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("crew");

  // Crew state
  const [crewStep, setCrewStep] = useState<CrewStep>("code");
  const [accessCode, setAccessCode] = useState("");
  const [crewName, setCrewName] = useState("");
  const [crewPassword, setCrewPassword] = useState("");
  const [crewConfirm, setCrewConfirm] = useState("");
  const [showCrewPassword, setShowCrewPassword] = useState(false);

  // Admin state
  const [adminStep, setAdminStep] = useState<AdminStep>("login");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirm, setCreateConfirm] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Biometrics
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");
  const [biometricSaved, setBiometricSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const expired = await checkAndClearSessionExpired();
      if (expired) setSessionExpired(true);
      const available = await isBiometricAvailable();
      if (!available) return;
      const label = await getBiometricLabel();
      const saved = await hasSavedBiometricCredentials();
      setBiometricAvailable(true);
      setBiometricLabel(label);
      setBiometricSaved(saved);
    })();
  }, []);

  // ── Offer to enable biometrics after a successful manual login ─
  const offerBiometrics = (creds: Parameters<typeof saveBiometricCredentials>[0]) => {
    if (!biometricAvailable || biometricSaved) return;
    Alert.alert(
      `Enable ${biometricLabel}?`,
      `Log in faster next time using ${biometricLabel} instead of your password.`,
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Enable",
          onPress: async () => {
            await saveBiometricCredentials(creds);
            setBiometricSaved(true);
          },
        },
      ]
    );
  };

  // ── Biometric login ────────────────────────────────────────────
  const handleBiometricLogin = async () => {
    setError(null);
    try {
      const authed = await authenticateWithBiometrics(biometricLabel);
      if (!authed) return;
      const creds = await loadBiometricCredentials();
      if (!creds) { setError("No saved credentials found. Please log in with your password."); return; }
      setLoading(true);
      if (creds.type === "admin") {
        const response = await apiFetch(
          "/api/auth/login",
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: creds.email, password: creds.password }) },
          { auth: false }
        );
        const data = await response.json();
        const token = typeof data?.access_token === "string" ? data.access_token : "";
        if (!token) throw new Error("Invalid login response");
        await saveAuthSession(token, "admin");
      } else {
        const formData = new FormData();
        formData.append("access_code", creds.accessCode);
        formData.append("password", creds.password);
        const response = await apiFetch("/api/crew/login", { method: "POST", body: formData }, { auth: false });
        const data = await response.json();
        const token = typeof data?.access_token === "string" ? data.access_token : "";
        if (!token) throw new Error("Invalid login response");
        await saveAuthSession(token, "crew");
      }
      router.replace("/(tabs)");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Saved credentials are no longer valid — clear them
        await clearBiometricCredentials();
        setBiometricSaved(false);
        setError("Saved login expired. Please log in with your password.");
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setSuccess(null);
  };

  // ── Crew: step 1 — check access code ──────────────────────────
  const handleCrewCheckCode = async () => {
    setError(null);
    const code = accessCode.trim().toUpperCase();
    if (!code) { setError("Please enter your access code."); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("access_code", code);
      const response = await apiFetch("/api/crew/check", { method: "POST", body: formData }, { auth: false });
      const data = await response.json();
      setCrewName(data.name ?? "");
      setCrewStep(data.has_password ? "enter-password" : "set-password");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Access code not found. Check with your production admin.");
    } finally {
      setLoading(false);
    }
  };

  // ── Crew: step 2a — create password ───────────────────────────
  const handleCrewSetPassword = async () => {
    setError(null);
    const pwErr = validatePassword(crewPassword);
    if (pwErr) { setError(pwErr); return; }
    if (crewPassword !== crewConfirm) { setError("Passwords do not match."); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("access_code", accessCode.trim().toUpperCase());
      formData.append("password", crewPassword);
      const response = await apiFetch("/api/crew/set-password", { method: "POST", body: formData }, { auth: false });
      const data = await response.json();
      const token = typeof data?.access_token === "string" ? data.access_token : "";
      if (!token) throw new Error("Invalid response");
      await saveAuthSession(token, "crew");
      offerBiometrics({ type: "crew", accessCode: accessCode.trim().toUpperCase(), password: crewPassword });
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Crew: step 2b — enter password ────────────────────────────
  const handleCrewLogin = async () => {
    setError(null);
    if (!crewPassword.trim()) { setError("Password is required."); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("access_code", accessCode.trim().toUpperCase());
      formData.append("password", crewPassword);
      const response = await apiFetch("/api/crew/login", { method: "POST", body: formData }, { auth: false });
      const data = await response.json();
      const token = typeof data?.access_token === "string" ? data.access_token : "";
      if (!token) throw new Error("Invalid response");
      await saveAuthSession(token, "crew");
      offerBiometrics({ type: "crew", accessCode: accessCode.trim().toUpperCase(), password: crewPassword });
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Admin login ────────────────────────────────────────────────
  const handleAdminLogin = async () => {
    setError(null);
    const emailErr = validateEmail(adminEmail);
    if (emailErr) { setError(emailErr); return; }
    if (!adminPassword.trim()) { setError("Password is required."); return; }
    try {
      setLoading(true);
      const response = await apiFetch(
        "/api/auth/login",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword }) },
        { auth: false }
      );
      const data = await response.json();
      const token = typeof data?.access_token === "string" ? data.access_token : "";
      if (!token) throw new Error("Invalid login response");
      await saveAuthSession(token, "admin");
      offerBiometrics({ type: "admin", email: adminEmail.trim(), password: adminPassword });
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Create production account ──────────────────────────────────
  const handleCreateAccount = async () => {
    setError(null);
    setSuccess(null);
    const emailErr = validateEmail(createEmail);
    if (emailErr) { setError(emailErr); return; }
    if (!acceptedTerms) { setError("You must accept the Terms and Conditions."); return; }
    const pwErr = validatePassword(createPassword);
    if (pwErr) { setError(pwErr); return; }
    if (createPassword !== createConfirm) { setError("Passwords do not match."); return; }
    if (!createConfirm.trim()) { setError("Please confirm your password."); return; }
    try {
      setLoading(true);
      const response = await apiFetch(
        "/api/productions",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: createEmail.trim(), password: createPassword }) },
        { auth: false }
      );
      const data = await response.json();
      setSuccess(typeof data?.message === "string" ? data.message : "Account created! You can now log in.");
      setAdminStep("login");
      setAdminEmail(createEmail.trim());
      setCreateEmail("");
      setCreatePassword("");
      setCreateConfirm("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={images.backgroundImage} className="flex-1" resizeMode="cover">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-10 justify-center">

            <View className="items-center mb-2">
              <Image source={images.logo} style={{ width: 260, height: 260 }} />
            </View>

            {/* ── Session expired banner ── */}
            {sessionExpired && (
              <View className="bg-yellow-400/90 rounded-2xl px-4 py-3 mb-4">
                <Text className="text-primary font-semibold text-sm text-center">
                  Your session has expired. Please log in again.
                </Text>
              </View>
            )}

            {/* ── Biometric quick login ── */}
            {biometricAvailable && biometricSaved && (
              <TouchableOpacity
                className="bg-white/20 py-4 rounded-full items-center mb-4"
                activeOpacity={0.85}
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-white text-base font-semibold">Log in with {biometricLabel}</Text>
                }
              </TouchableOpacity>
            )}

            {/* ── Instruction text ── */}
            <Text className="text-white text-center text-base font-medium mb-4" style={{ lineHeight: 22 }}>
              {tab === "crew" && crewStep === "code" && "Enter the access code you received from your production admin."}
              {tab === "crew" && crewStep === "set-password" && `Welcome, ${crewName}! This is your first login — create a password to use every time you log in.`}
              {tab === "crew" && crewStep === "enter-password" && `Welcome back, ${crewName}!`}
              {tab === "admin" && adminStep === "login" && "Log in with your production email and password."}
              {tab === "admin" && adminStep === "create" && "Create an account for your production. You'll use your email and password to log in."}
            </Text>

            {/* ── Tab switcher (hidden once past the first step) ── */}
            {((tab === "admin" && adminStep === "login") || (tab === "crew" && crewStep === "code")) && (
            <View className="flex-row bg-white/80 rounded-full p-1 mb-6">
              {(["crew", "admin"] as Tab[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  className={`flex-1 rounded-full py-2 items-center ${tab === t ? "bg-darkBlue" : ""}`}
                  onPress={() => switchTab(t)}
                  activeOpacity={0.85}
                >
                  <Text className={`text-sm font-semibold ${tab === t ? "text-white" : "text-primary"}`}>
                    {t === "crew" ? "Crew" : "Admin"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            )}

            {/* ══ CREW TAB ══ */}
            {tab === "crew" && (
              <View className="gap-4">

                {crewStep === "code" && (
                  <>
                    <TextInput
                      className="bg-white rounded-2xl px-4 text-base"
                      placeholder="Access code (e.g. JASON-4829)"
                      value={accessCode}
                      onChangeText={setAccessCode}
                      autoCapitalize="characters"
                      placeholderTextColor="#6B7280"
                      style={inputStyle}
                    />
                    <TouchableOpacity
                      className="bg-darkBlue py-4 rounded-full items-center"
                      activeOpacity={0.85}
                      onPress={handleCrewCheckCode}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-semibold">Continue</Text>}
                    </TouchableOpacity>
                  </>
                )}

                {crewStep === "set-password" && (
                  <>
                    <TextInput
                      className="bg-white rounded-2xl px-4 text-base"
                      placeholder="New password (min. 8 characters)"
                      value={crewPassword}
                      onChangeText={setCrewPassword}
                      secureTextEntry={!showCrewPassword}
                      placeholderTextColor="#6B7280"
                      style={inputStyle}
                    />
                    <TextInput
                      className="bg-white rounded-2xl px-4 text-base"
                      placeholder="Confirm password"
                      value={crewConfirm}
                      onChangeText={setCrewConfirm}
                      secureTextEntry={!showCrewPassword}
                      placeholderTextColor="#6B7280"
                      style={inputStyle}
                    />
                    <TouchableOpacity className="self-end -mt-2" activeOpacity={0.85} onPress={() => setShowCrewPassword((p) => !p)}>
                      <Text className="text-white text-sm font-semibold">{showCrewPassword ? "Hide" : "Show"} password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-darkBlue py-4 rounded-full items-center"
                      activeOpacity={0.85}
                      onPress={handleCrewSetPassword}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-semibold">Create Password & Log In</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-white/20 py-3 rounded-full items-center" activeOpacity={0.85} onPress={() => { setCrewStep("code"); setError(null); setCrewPassword(""); setCrewConfirm(""); }}>
                      <Text className="text-white text-base font-semibold">&larr; Back</Text>
                    </TouchableOpacity>
                  </>
                )}

                {crewStep === "enter-password" && (
                  <>
                    <TextInput
                      className="bg-white rounded-2xl px-4 text-base"
                      placeholder="Password"
                      value={crewPassword}
                      onChangeText={setCrewPassword}
                      secureTextEntry={!showCrewPassword}
                      placeholderTextColor="#6B7280"
                      style={inputStyle}
                    />
                    <TouchableOpacity className="self-end -mt-2" activeOpacity={0.85} onPress={() => setShowCrewPassword((p) => !p)}>
                      <Text className="text-white text-sm font-semibold">{showCrewPassword ? "Hide" : "Show"} password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-darkBlue py-4 rounded-full items-center"
                      activeOpacity={0.85}
                      onPress={handleCrewLogin}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-semibold">Log In</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-white/20 py-3 rounded-full items-center" activeOpacity={0.85} onPress={() => { setCrewStep("code"); setError(null); setCrewPassword(""); }}>
                      <Text className="text-white text-base font-semibold">&larr; Back</Text>
                    </TouchableOpacity>
                  </>
                )}

              </View>
            )}

            {/* ══ ADMIN TAB ══ */}
            {tab === "admin" && (
              <View className="gap-4">

                {adminStep === "login" && (
                  <>
                    <TextInput
                      className="bg-white rounded-2xl px-4 text-base"
                      placeholder="Email"
                      value={adminEmail}
                      onChangeText={setAdminEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor="#6B7280"
                      style={inputStyle}
                    />
                    <TextInput
                      className="bg-white rounded-2xl px-4 text-base"
                      placeholder="Password"
                      value={adminPassword}
                      onChangeText={setAdminPassword}
                      secureTextEntry={!showAdminPassword}
                      placeholderTextColor="#6B7280"
                      style={inputStyle}
                    />
                    <TouchableOpacity className="self-end -mt-2" activeOpacity={0.85} onPress={() => setShowAdminPassword((p) => !p)}>
                      <Text className="text-white text-sm font-semibold">{showAdminPassword ? "Hide" : "Show"} password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-darkBlue py-4 rounded-full items-center"
                      activeOpacity={0.85}
                      onPress={handleAdminLogin}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-semibold">Log In</Text>}
                    </TouchableOpacity>
                    <View className="items-center gap-3">
                      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/reset_password")}>
                        <Text className="text-white text-sm font-semibold">Forgot password?</Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.85} onPress={() => { setError(null); setSuccess(null); setAdminStep("create"); }}>
                        <Text className="text-white text-sm font-semibold">Create new production account</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {adminStep === "create" && (
                  <>
                    <TextInput
                      className="bg-white rounded-2xl px-4 text-base"
                      placeholder="Email"
                      value={createEmail}
                      onChangeText={setCreateEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor="#6B7280"
                      style={inputStyle}
                    />
                    <TextInput
                      className="bg-white rounded-2xl px-4 text-base"
                      placeholder="Password (min. 8 characters)"
                      value={createPassword}
                      onChangeText={setCreatePassword}
                      secureTextEntry={!showCreatePassword}
                      placeholderTextColor="#6B7280"
                      style={inputStyle}
                    />
                    <TextInput
                      className="bg-white rounded-2xl px-4 text-base"
                      placeholder="Confirm password"
                      value={createConfirm}
                      onChangeText={setCreateConfirm}
                      secureTextEntry={!showCreatePassword}
                      placeholderTextColor="#6B7280"
                      style={inputStyle}
                    />
                    <TouchableOpacity className="self-end -mt-2" activeOpacity={0.85} onPress={() => setShowCreatePassword((p) => !p)}>
                      <Text className="text-white text-sm font-semibold">{showCreatePassword ? "Hide" : "Show"} password</Text>
                    </TouchableOpacity>
                    <View className="flex-row items-center flex-wrap">
                      <TouchableOpacity className="flex-row items-center" activeOpacity={0.85} onPress={() => setAcceptedTerms((p) => !p)}>
                        <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${acceptedTerms ? "bg-darkBlue border-darkBlue" : "bg-white border-gray-400"}`}>
                          {acceptedTerms ? <Text className="text-white text-xs font-bold">X</Text> : null}
                        </View>
                        <Text className="text-white text-base">I accept </Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.85} onPress={() => setTermsVisible(true)}>
                        <Text className="text-white text-base underline font-semibold">Terms and Conditions</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      className="bg-darkBlue py-4 rounded-full items-center"
                      activeOpacity={0.85}
                      onPress={handleCreateAccount}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-semibold">Create Account</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-white/20 py-3 rounded-full items-center" activeOpacity={0.85} onPress={() => { setAdminStep("login"); setError(null); }}>
                      <Text className="text-white text-base font-semibold">&larr; Back</Text>
                    </TouchableOpacity>
                  </>
                )}

              </View>
            )}

            {error ? <Text className="text-red-400 text-base mt-4">{error}</Text> : null}
            {success ? <Text className="text-green-400 text-base mt-4">{success}</Text> : null}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Terms & Conditions modal ── */}
      <Modal animationType="slide" transparent visible={termsVisible} onRequestClose={() => setTermsVisible(false)}>
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-2xl p-5" style={{ maxHeight: 560 }}>
            <Text className="text-xl font-semibold text-primary mb-1">Terms and Conditions</Text>
            <Text className="text-sm text-gray-500 mb-4">Effective Date: February 17, 2026</Text>
            <ScrollView className="mb-4" showsVerticalScrollIndicator>
              <Text className="text-base text-gray-700 mb-3">By creating an account or using this app, you agree to these Terms and Conditions.</Text>
              <Text className="text-base font-semibold text-primary mb-1">1. Purpose of the App</Text>
              <Text className="text-base text-gray-700 mb-3">This app supports and speeds up film production workflows, including continuity and production support tasks.</Text>
              <Text className="text-base font-semibold text-primary mb-1">2. Talent Data and Storage</Text>
              <Text className="text-base text-gray-700 mb-3">Talent details and related production data are stored on a secure server with reasonable technical and organizational safeguards.</Text>
              <Text className="text-base font-semibold text-primary mb-1">3. Permitted Data Use</Text>
              <Text className="text-base text-gray-700 mb-3">You authorize the app to use submitted data, including talent-related data, to operate app features and improve its neural network model performance. Data use is limited to film-production functions and quality improvements only.</Text>
              <Text className="text-base font-semibold text-primary mb-1">4. No Harmful or Unrelated Use</Text>
              <Text className="text-base text-gray-700 mb-3">Data will not be used for unrelated commercial exploitation or harmful purposes, including malicious targeting, harassment, or misuse.</Text>
              <Text className="text-base font-semibold text-primary mb-1">5. AI Accuracy Disclaimer</Text>
              <Text className="text-base text-gray-700 mb-3">The app uses AI and machine-learning systems that may produce errors, omissions, false positives, false negatives, or inconsistent results.</Text>
              <Text className="text-base font-semibold text-primary mb-1">6. User Responsibility</Text>
              <Text className="text-base text-gray-700 mb-3">AI outputs are assistive only. You are responsible for reviewing outputs and making final production decisions.</Text>
              <Text className="text-base font-semibold text-primary mb-1">7. Limitation of Liability</Text>
              <Text className="text-base text-gray-700 mb-3">To the maximum extent permitted by law, the app and its operators are not liable for losses, continuity issues, delays, costs, or damages arising from app use or AI outputs.</Text>
              <Text className="text-base font-semibold text-primary mb-1">8. Account Security</Text>
              <Text className="text-base text-gray-700 mb-3">You are responsible for maintaining the confidentiality of your account credentials and activities under your account.</Text>
              <Text className="text-base font-semibold text-primary mb-1">9. Data Rights and Deletion</Text>
              <Text className="text-base text-gray-700 mb-3">You may request deletion of your production account and associated data through available app controls or support channels, subject to legal or operational retention requirements.</Text>
              <Text className="text-base font-semibold text-primary mb-1">10. Changes to Terms</Text>
              <Text className="text-base text-gray-700 mb-1">These Terms may be updated from time to time. Continued use of the app after updates means you accept the revised Terms.</Text>
            </ScrollView>
            <TouchableOpacity className="bg-darkBlue py-3 rounded-full items-center" activeOpacity={0.85} onPress={() => setTermsVisible(false)}>
              <Text className="text-white text-base font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}
