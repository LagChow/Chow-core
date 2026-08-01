// ──────────────────────────────────────────────
// LagChow — Shared Utilities
// ──────────────────────────────────────────────

import { CURRENCY } from "@lagchow/config";

export * from './push';
/** Format a number as Naira currency */
export function formatPrice(amount: number): string {
  return `${CURRENCY}${amount.toLocaleString("en-NG")}`;
}

/** Calculate service fee from subtotal */
export function calculateServiceFee(subtotal: number, percent: number = 5): number {
  return Math.round(subtotal * (percent / 100));
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/** Generate a short order reference (e.g. "LC-A3F8") */
export function generateOrderRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 4; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return `LC-${ref}`;
}
