import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Detect Expo host IP for physical devices running via Expo Go
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp) {
      return `http://${hostIp}:5001/api/v1`;
    }
  }

  // Android Emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api/v1';
  }

  // Default fallback for iOS Simulator / Web
  return 'http://localhost:5001/api/v1';
};

const API_BASE_URL = getBaseUrl();

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
      const token = await AsyncStorage.getItem('smart_campus_token');
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
