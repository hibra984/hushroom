import { create } from "zustand";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: "seeker" | "companion" | "admin";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User, token: string) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    }),

  clearUser: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));
