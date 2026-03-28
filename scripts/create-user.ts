/**
 * Crea un usuario y su fila vacía en finance_state.
 * Uso:
 *   CREATE_USER_PASSWORD='tu-clave-segura' npx tsx scripts/create-user.ts cesar.guerrero
 *
 * Requiere DATABASE_URL en .env.local y que hayas aplicado el esquema: npm run db:push
 */

import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../src/db/index";
import { createDefaultBundle } from "../src/lib/default-state";
import { normalizeUsername } from "../src/lib/auth-users";

function loadEnvLocal(): void {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) {
    console.error("No se encontró .env.local (define DATABASE_URL).");
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
  const rawUser = process.argv[2];
  const password = process.env.CREATE_USER_PASSWORD;
  if (!rawUser?.trim()) {
    console.error("Uso: CREATE_USER_PASSWORD='...' npx tsx scripts/create-user.ts <usuario>");
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error("Define CREATE_USER_PASSWORD (mínimo 8 caracteres) en el entorno.");
    process.exit(1);
  }

  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL no configurada.");
    process.exit(1);
  }

  const username = normalizeUsername(rawUser);
  const existing = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
  if (existing.length > 0) {
    console.error(`El usuario "${username}" ya existe.`);
    process.exit(1);
  }

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(schema.users).values({
    id,
    username,
    passwordHash,
  });

  await db.insert(schema.financeState).values({
    userId: id,
    payload: createDefaultBundle(),
  });

  console.log(`Usuario creado: ${username} (id=${id})`);
  console.log("Puede iniciar sesión en la app con esa contraseña.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
