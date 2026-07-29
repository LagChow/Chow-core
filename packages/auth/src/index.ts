// ──────────────────────────────────────────────
// LagChow — Authentication Utilities
// ──────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  userId: string;
  role: "customer" | "vendor" | "rider" | "admin";
  tokens: AuthTokens;
}

/** Placeholder — implement with your auth provider */
export function isAuthenticated(): boolean {
  // TODO: Implement token validation
  return false;
}

/** Placeholder — implement with your auth provider */
export function getSession(): AuthSession | null {
  // TODO: Implement session retrieval
  return null;
}
