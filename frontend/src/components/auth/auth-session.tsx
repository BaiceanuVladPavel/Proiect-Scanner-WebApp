"use client";

import { useEffect } from "react";

import { getAccessToken, getRefreshToken } from "@/lib/auth";
import { refreshSession } from "@/services/auth";

export function AuthSession() {
  useEffect(() => {
    if (!getRefreshToken() || getAccessToken()) {
      return;
    }

    void refreshSession().catch(() => {
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    });
  }, []);

  return null;
}
