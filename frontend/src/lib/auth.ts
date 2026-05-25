import type { AuthTokens } from "@/types/auth";

export const ACCESS_TOKEN_COOKIE = "inventory_access_token";
export const REFRESH_TOKEN_COOKIE = "inventory_refresh_token";
export const ACCESS_TOKEN_MAX_AGE = 60 * 30;
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

function isBrowser() {
  return typeof document !== "undefined";
}

function getCookieValue(name: string) {
  if (!isBrowser()) {
    return null;
  }

  const value = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function getAccessToken() {
  return getCookieValue(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken() {
  return getCookieValue(REFRESH_TOKEN_COOKIE);
}

export function persistAuthTokens(tokens: AuthTokens) {
  setCookie(ACCESS_TOKEN_COOKIE, tokens.access, ACCESS_TOKEN_MAX_AGE);
  setCookie(REFRESH_TOKEN_COOKIE, tokens.refresh, REFRESH_TOKEN_MAX_AGE);
}

export function updateAccessToken(access: string) {
  setCookie(ACCESS_TOKEN_COOKIE, access, ACCESS_TOKEN_MAX_AGE);
}

export function clearAuthTokens() {
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(REFRESH_TOKEN_COOKIE);
}
