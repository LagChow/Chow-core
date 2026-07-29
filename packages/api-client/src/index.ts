// ──────────────────────────────────────────────
// LagChow — API Client
// ──────────────────────────────────────────────

import { getApiBaseUrl } from "@lagchow/config";

/** Create a typed fetch wrapper for the LagChow API */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export { getApiBaseUrl };
