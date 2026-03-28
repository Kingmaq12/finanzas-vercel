/** One-off: inspeccionar tablas en Neon. Uso: npx tsx scripts/inspect-db.ts */
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
  const tables = (await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name`) as { table_name: string }[];
  console.log("Tables:", tables.map((r) => r.table_name));
  for (const name of ["finance_state", "users"]) {
    const cols = await sql`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${name} ORDER BY ordinal_position`;
    if (cols.length) console.log(name, cols);
  }
}

main().catch(console.error);
