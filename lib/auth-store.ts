"use client";

import { create } from "zustand";
import {
  ApiClientError,
  authApi,
  clearToken,
  getToken,
  setToken,
  type AuthUser,
} from "@/lib/api";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  loading: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  loading: false,

  async hydrate() {
    if (get().hydrated) return;
    const token = getToken();
    if (!token) {
      set({ token: null, user: null, hydrated: true });
      return;
    }

    set({ token, loading: true });
    try {
      const res = await authApi.me();
      set({ user: res.data, hydrated: true, loading: false });
    } catch {
      clearToken();
      set({ token: null, user: null, hydrated: true, loading: false });
    }
  },

  async login(email, password) {
    set({ loading: true });
    try {
      const res = await authApi.login({
        email,
        password,
        device_name: "kham_dashboard",
      });
      setToken(res.data.token);
      set({
        token: res.data.token,
        user: res.data.user,
        loading: false,
        hydrated: true,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  async logout() {
    try {
      if (get().token) await authApi.logout();
    } catch (error) {
      if (!(error instanceof ApiClientError && error.status === 401)) {
        // still clear local session
      }
    } finally {
      clearToken();
      set({ token: null, user: null });
    }
  },

  setUser(user) {
    set({ user });
  },
}));
