import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/** Vercel/Neon pueden exponer la URL con distintos nombres según la integración. */
function getDatabaseUrl(): string | undefined {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  return url?.trim() || undefined;
}

export function getDb() {
  const url = getDatabaseUrl();
  if (!url) return null;
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export { schema };
