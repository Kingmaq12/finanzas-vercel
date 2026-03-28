import { jwtVerify, SignJWT } from "jose";

const COOKIE_NAME = "finanzas_session";

export function isAuthEnabled(): boolean {
  return Boolean(process.env.FINANCE_PASSWORD && process.env.SESSION_SECRET);
}

function getSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET debe tener al menos 16 caracteres");
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ ok: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("60d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
