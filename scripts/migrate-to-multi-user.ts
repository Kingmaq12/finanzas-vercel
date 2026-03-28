/**
 * Migra finance_state (id) → users + finance_state (user_id).
 * Ejecutar una vez: npx tsx scripts/migrate-to-multi-user.ts
 *
 * - Respalda payloads en ./backups/finance-state-<id>.json
 * - Renombra tabla antigua a finance_state_legacy
 * - Crea users + finance_state nuevas
 */
import { neon } from "@neondatabase/serverless";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal(): void {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) {
    console.error("No .env.local");
    process.exit(1);
  }
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
  if (!url) process.exit(1);
  const sql = neon(url);

  const hasUsers = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'`;
  if (hasUsers.length > 0) {
    console.log("La tabla users ya existe. No se repite la migración de esquema.");
    return;
  }

  const fsCols = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'finance_state'`) as {
    column_name: string;
  }[];
  const colnames = fsCols.map((r) => r.column_name);
  if (!colnames.includes("id")) {
    console.log("finance_state ya parece multi-usuario (sin columna id). Salida.");
    return;
  }

  const rows = await sql`SELECT id, payload, updated_at FROM finance_state`;
  const backupDir = resolve(process.cwd(), "backups");
  mkdirSync(backupDir, { recursive: true });
  for (const row of rows as { id: string; payload: unknown; updated_at: string }[]) {
    const name = `finance-state-${row.id.replace(/[^a-z0-9_-]/gi, "_")}.json`;
    const path = resolve(backupDir, name);
    writeFileSync(path, JSON.stringify(row.payload, null, 2), "utf8");
    console.log("Respaldo escrito:", path);
  }

  await sql`ALTER TABLE finance_state RENAME TO finance_state_legacy`;

  await sql`
    CREATE TABLE users (
      id text PRIMARY KEY NOT NULL,
      username text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;

  await sql`
    CREATE TABLE finance_state (
      user_id text PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      payload jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;

  console.log("Migración OK: finance_state_legacy + tablas users y finance_state nuevas.");
  console.log("Siguiente: npm run db:create-user (por cada usuario).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
