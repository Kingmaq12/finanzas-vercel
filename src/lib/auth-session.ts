import { jwtVerify, SignJWT } from "jose";

export const COOKIE_NAME = "finanzas_session";

function hasDatabaseUrl(): boolean {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  return Boolean(url?.trim());
}

/** Login multi-usuario: requiere Neon (u otra URL) + SESSION_SECRET. */
export function isAuthEnabled(): boolean {
  const s = process.env.SESSION_SECRET;
  return hasDatabaseUrl() && Boolean(s && s.length >= 16);
}

function getSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET debe tener al menos 16 caracteres");
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  userId: string;
  username: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    username: payload.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setExpirationTime("60d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const username = payload.username;
    if (!userId || typeof username !== "string") return null;
    return { userId, username };
  } catch {
    return null;
  }
}
