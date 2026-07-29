// ──────────────────────────────────────────────
// LagChow — Shared Configuration
// ──────────────────────────────────────────────

export const APP_NAME = "LagChow";
export const APP_TAGLINE = "Campus-first food delivery for UNILAG";

export const CURRENCY = "₦";
export const CURRENCY_CODE = "NGN";

/** Service fee percentage charged to customers */
export const SERVICE_FEE_PERCENT = 5;

/** Base delivery fee in Naira */
export const BASE_DELIVERY_FEE = 200;

/** Order statuses in their lifecycle order */
export const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "delivered",
] as const;

/** Get the API base URL based on environment */
export function getApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  return "http://localhost:4000";
}
