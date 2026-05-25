import axios from "axios";

import { api } from "@/lib/api";
import { clearAuthTokens, getRefreshToken, persistAuthTokens } from "@/lib/auth";
import type { AuthUser, LoginResponse } from "@/types/auth";

const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  timeout: 5000,
});

export async function login(username: string, password: string) {
  const response = await authApi.post<LoginResponse>("/auth/login/", {
    username,
    password,
  });
  persistAuthTokens({
    access: response.data.access,
    refresh: response.data.refresh,
  });
  return response.data.user;
}

export async function refreshSession() {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("No refresh token available.");
  }

  const response = await authApi.post<{ access: string; refresh: string }>("/auth/refresh/", {
    refresh,
  });

  persistAuthTokens(response.data);
  return response.data.access;
}

export async function logout() {
  const refresh = getRefreshToken();

  try {
    if (refresh) {
      await api.post("/auth/logout/", { refresh });
    }
  } finally {
    clearAuthTokens();
  }
}

export async function fetchCurrentUser() {
  const response = await api.get<AuthUser>("/auth/me/");
  return response.data;
}
