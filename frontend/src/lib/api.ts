import axios from "axios";

import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  persistAuthTokens,
} from "@/lib/auth";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  timeout: 5000,
});

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("No refresh token available.");
  }

  const response = await axios.post<{ access: string; refresh: string }>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api"}/auth/refresh/`,
    { refresh },
    { timeout: 5000 },
  );

  persistAuthTokens(response.data);
  return response.data.access;
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (!originalRequest || originalRequest._retry || error.response?.status !== 401) {
      throw error;
    }

    if (!getRefreshToken()) {
      clearAuthTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw error;
    }

    originalRequest._retry = true;

    try {
      refreshRequest ??= refreshAccessToken().finally(() => {
        refreshRequest = null;
      });

      const nextAccessToken = await refreshRequest;
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearAuthTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw refreshError;
    }
  },
);
