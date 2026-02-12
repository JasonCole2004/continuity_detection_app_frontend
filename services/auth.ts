import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_PRODUCTION_ID_KEY = "auth_production_id";

export const authStorageKeys = {
  token: AUTH_TOKEN_KEY,
  productionId: AUTH_PRODUCTION_ID_KEY,
};

export const saveAuthSession = async (token: string, productionId: string) => {
  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, token],
    [AUTH_PRODUCTION_ID_KEY, productionId],
  ]);
};

export const clearAuthSession = async () => {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_PRODUCTION_ID_KEY, "auth"]);
};

export const getAccessToken = async () => {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
};

export const getProductionId = async () => {
  return AsyncStorage.getItem(AUTH_PRODUCTION_ID_KEY);
};
