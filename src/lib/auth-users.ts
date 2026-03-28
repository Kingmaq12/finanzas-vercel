import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function verifyUserPassword(
  rawUsername: string,
  password: string,
): Promise<{ userId: string; username: string } | null> {
  const db = getDb();
  if (!db) return null;
  const username = normalizeUsername(rawUsername);
  if (!username) return null;
  const row = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const u = row[0];
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return null;
  return { userId: u.id, username: u.username };
}
