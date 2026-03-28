/**
 * Crea hogar "main", asocia todos los usuarios y estado compartido vacío.
 * Uso: npx tsx scripts/ensure-household.ts
 */
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../src/db/index";
import { createDefaultSharedPayload } from "../src/lib/shared-household-types";

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

const HOUSEHOLD_ID = "main";

async function main() {
  loadEnvLocal();
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL");
    process.exit(1);
  }

  const hh = await db.select().from(schema.households).where(eq(schema.households.id, HOUSEHOLD_ID)).limit(1);
  if (hh.length === 0) {
    await db.insert(schema.households).values({
      id: HOUSEHOLD_ID,
      name: "Hogar",
    });
    console.log("Hogar creado:", HOUSEHOLD_ID);
  }

  const users = await db.select().from(schema.users);
  for (const u of users) {
    const m = await db
      .select()
      .from(schema.householdMembers)
      .where(eq(schema.householdMembers.userId, u.id))
      .limit(1);
    if (m.length === 0) {
      await db.insert(schema.householdMembers).values({
        id: randomUUID(),
        householdId: HOUSEHOLD_ID,
        userId: u.id,
      });
      console.log("Miembro:", u.username);
    }
  }

  const st = await db
    .select()
    .from(schema.sharedHouseholdState)
    .where(eq(schema.sharedHouseholdState.householdId, HOUSEHOLD_ID))
    .limit(1);
  if (st.length === 0) {
    await db.insert(schema.sharedHouseholdState).values({
      householdId: HOUSEHOLD_ID,
      payload: createDefaultSharedPayload(),
      updatedAt: new Date(),
    });
    console.log("Estado compartido inicial creado.");
  }

  console.log("Listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
