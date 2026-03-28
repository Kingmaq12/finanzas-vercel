/**
 * Copia payload desde finance_state_legacy (id=default) al usuario indicado.
 * Uso: npx tsx scripts/copy-legacy-payload-to-user.ts cesar.guerrero
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
  const rawUser = process.argv[2];
  if (!rawUser?.trim()) {
    console.error("Uso: npx tsx scripts/copy-legacy-payload-to-user.ts <usuario>");
    process.exit(1);
  }
  const username = rawUser.trim().toLowerCase();
  const sql = neon(process.env.DATABASE_URL!);

  const leg = await sql`
    SELECT payload, updated_at FROM finance_state_legacy WHERE id = 'default' LIMIT 1`;
  if (leg.length === 0) {
    console.log("No hay fila legacy id=default; nada que copiar.");
    return;
  }

  const r = await sql`
    UPDATE finance_state fs
    SET payload = ${leg[0].payload}, updated_at = ${leg[0].updated_at}
    WHERE fs.user_id = (SELECT id FROM users WHERE username = ${username})
    RETURNING fs.user_id`;
  if (r.length === 0) {
    console.error("Usuario no encontrado o sin fila en finance_state.");
    process.exit(1);
  }
  console.log("Payload legacy copiado a:", username);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
