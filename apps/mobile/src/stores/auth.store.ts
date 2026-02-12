import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiClientError } from '../lib/api-client';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  role: string;
  isEmailVerified: boolean;
  isAgeVerified: boolean;
  preferredLanguage: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  register: (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth: string;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<AuthResponse>('/auth/register', data);
      await AsyncStorage.setItem('accessToken', res.accessToken);
      await AsyncStorage.setItem('refreshToken', res.refreshToken);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : 'Registration failed';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      await AsyncStorage.setItem('accessToken', res.accessToken);
      await AsyncStorage.setItem('refreshToken', res.refreshToken);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : 'Login failed';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore logout errors
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshAuth: async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await apiClient.post<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken },
      );
      await AsyncStorage.setItem('accessToken', res.accessToken);
      await AsyncStorage.setItem('refreshToken', res.refreshToken);

      const user = await apiClient.get<User>('/users/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await apiClient.get<User>('/users/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await get().refreshAuth();
    }
  },
}));
