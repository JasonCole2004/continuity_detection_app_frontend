import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_ROLE_KEY = "auth_role";

export const saveAuthSession = async (
  token: string,
  role: "admin" | "crew"
) => {
  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, token],
    [AUTH_ROLE_KEY, role],
  ]);
};

export const clearAuthSession = async () => {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_ROLE_KEY, "auth"]);
};

export const getAccessToken = async () => {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
};

export const getRole = async (): Promise<"admin" | "crew" | null> => {
  const role = await AsyncStorage.getItem(AUTH_ROLE_KEY);
  if (role === "admin" || role === "crew") return role;
  return null;
};

const SESSION_EXPIRED_KEY = "session_expired";

export const markSessionExpired = async () => {
  await AsyncStorage.setItem(SESSION_EXPIRED_KEY, "1");
};

export const checkAndClearSessionExpired = async (): Promise<boolean> => {
  const val = await AsyncStorage.getItem(SESSION_EXPIRED_KEY);
  if (val) await AsyncStorage.removeItem(SESSION_EXPIRED_KEY);
  return val === "1";
};
