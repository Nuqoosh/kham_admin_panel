import { getApiBaseUrl } from "@/lib/api/client";

/** API origin without the `/api/v1` suffix (e.g. http://localhost:8000). */
export function getApiOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/v\d+\/?$/i, "").replace(/\/$/, "");
}

/**
 * Resolve product/media URLs for the dashboard.
 * Absolute URLs pass through; root-relative paths are prefixed with the API origin.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (url == null) return "";
  const value = String(url).trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("//")) {
    if (typeof window !== "undefined") {
      return `${window.location.protocol}${value}`;
    }
    return `https:${value}`;
  }
  if (value.startsWith("/")) return `${getApiOrigin()}${value}`;
  return value;
}
