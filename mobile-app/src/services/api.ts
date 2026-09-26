import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Detect Expo host IP for physical devices running via Expo Go
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants')?.default || require('expo-constants');
    const hostUri = Constants?.expoConfig?.hostUri;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp) {
        return `http://${hostIp}:5001/api/v1`;
      }
    }
  } catch {
    // Fallback if expo-constants is not loaded
  }

  // Android Emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api/v1';
  }

  // Default fallback for iOS Simulator / Web
  return 'http://localhost:5001/api/v1';
};

const API_BASE_URL = getBaseUrl();

const ACCESS_TOKEN_KEY = 'smart_campus_access_token';
const REFRESH_TOKEN_KEY = 'smart_campus_refresh_token';
export const USER_STORAGE_KEY = 'smart_campus_user';

/** Central place for reading/writing the token pair — everything else should go through this
 *  rather than touching AsyncStorage directly, so the storage keys only live in one place. */
export const tokenStorage = {
  getAccessToken: () => AsyncStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) =>
    AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]),
  clear: () => AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_STORAGE_KEY]),
};

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
/** Lets authStore react to a session dying (e.g. refresh token expired) without api.ts
 *  importing the store back — avoids a circular import between the two modules. */
export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async config => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Fallback
    }
    return config;
  },
  error => Promise.reject(error)
);

// Access tokens are short-lived (see backend JWT_EXPIRES_IN). On a 401 we
// transparently refresh once and retry the original request, so a session
// stays alive across the full refresh-token lifetime instead of dying every
// hour. Concurrent 401s share a single in-flight refresh call.
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then(async res => {
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        await tokenStorage.setTokens(accessToken, newRefreshToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || '';

    // Never try to "refresh" our way out of a failed login or a failed
    // refresh call itself — that would just loop.
    if (!originalRequest || url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        await tokenStorage.clear();
        unauthorizedHandler?.();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
