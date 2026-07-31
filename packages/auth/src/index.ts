// ──────────────────────────────────────────────
// LagChow — Authentication Utilities
// ──────────────────────────────────────────────
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_for_development_only_123'
);

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  userId: string;
  role: "customer" | "vendor" | "rider" | "admin";
  email?: string;
  tokens?: AuthTokens; // Optional since it might just be a simple session initially
}

/**
 * Sign a new JWT token
 */
export async function signToken(payload: any, expiresIn = '7d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthSession;
  } catch (error) {
    return null;
  }
}

/** 
 * Check if the current user is authenticated in a Next.js Server Context
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/** 
 * Retrieve the current session from the __session cookie in a Next.js Server Context
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;
    
    if (!token) return null;
    
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
}
