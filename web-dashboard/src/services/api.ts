import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

const ACCESS_TOKEN_KEY = 'smart_campus_access_token';
const REFRESH_TOKEN_KEY = 'smart_campus_refresh_token';
export const USER_STORAGE_KEY = 'smart_campus_user';

/** Central place for reading/writing the token pair — everything else should go through this
 *  rather than touching localStorage directly, so the storage keys only live in one place. */
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  },
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
});

// Request interceptor: attach the current access token, if any.
api.interceptors.request.use(
  config => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then(res => {
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        tokenStorage.setTokens(accessToken, newRefreshToken);
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
        tokenStorage.clear();
        unauthorizedHandler?.();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
