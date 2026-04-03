import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const CREDS_KEY = "biometric_credentials";

export type BiometricCredentials =
  | { type: "admin"; email: string; password: string }
  | { type: "crew"; accessCode: string; password: string };

export async function isBiometricAvailable(): Promise<boolean> {
  const hardware = await LocalAuthentication.hasHardwareAsync();
  if (!hardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "Face ID";
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "Touch ID";
  return "Biometrics";
}

export async function hasSavedBiometricCredentials(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(CREDS_KEY);
  return val !== null;
}

export async function authenticateWithBiometrics(label: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: `Log in with ${label}`,
    fallbackLabel: "Use password instead",
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function saveBiometricCredentials(creds: BiometricCredentials): Promise<void> {
  await SecureStore.setItemAsync(CREDS_KEY, JSON.stringify(creds));
}

export async function loadBiometricCredentials(): Promise<BiometricCredentials | null> {
  const val = await SecureStore.getItemAsync(CREDS_KEY);
  if (!val) return null;
  return JSON.parse(val) as BiometricCredentials;
}

export async function clearBiometricCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDS_KEY);
}
