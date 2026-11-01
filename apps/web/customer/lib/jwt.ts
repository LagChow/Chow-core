import { SignJWT, jwtVerify } from 'jose';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.VERCEL_ENV === 'production') {
      throw new Error('CRITICAL: JWT_SECRET environment variable is required in production.');
    }
    return new TextEncoder().encode('lagchow-dev-only-jwt-secret-do-not-use-in-prod');
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: any, expiresIn: string = '30d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecretKey());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload;
  } catch (error) {
    return null;
  }
}
