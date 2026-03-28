/**
 * Crea tablas hogar compartido + columna users.email sin prompts de drizzle-kit.
 * Uso: npx tsx scripts/apply-household-ddl.ts
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal(): void {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) process.exit(1);
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const ix = t.indexOf("=");
    if (ix === -1) continue;
    const key = t.slice(0, ix).trim();
    let val = t.slice(ix + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL");
  const sql = neon(url);

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email text`;

  await sql`
    CREATE TABLE IF NOT EXISTS households (
      id text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS household_members (
      id text PRIMARY KEY NOT NULL,
      household_id text NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS shared_household_state (
      household_id text PRIMARY KEY NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS household_calendar_events (
      id text PRIMARY KEY NOT NULL,
      household_id text NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      title text NOT NULL,
      starts_at timestamptz NOT NULL,
      ends_at timestamptz,
      notes text,
      notify_enabled boolean NOT NULL DEFAULT false,
      notify_emails jsonb NOT NULL,
      notify_minutes_before integer NOT NULL DEFAULT 1440,
      last_notified_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;

  console.log("DDL hogar compartido aplicado (idempotente).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
