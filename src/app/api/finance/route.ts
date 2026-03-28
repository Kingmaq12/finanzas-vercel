import { getDb, schema } from "@/db";
import {
  COOKIE_NAME,
  isAuthEnabled,
  verifySessionToken,
} from "@/lib/auth-session";
import type { FinanceBundle } from "@/lib/types";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ROW_ID = "default";

async function requireAuth(): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  if (!c) return false;
  return verifySessionToken(c);
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Sin base de datos" }, { status: 503 });
  }
  const rows = await db
    .select()
    .from(schema.financeState)
    .where(eq(schema.financeState.id, ROW_ID))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ bundle: null, updatedAt: null });
  }
  return NextResponse.json({
    bundle: row.payload,
    updatedAt: row.updatedAt?.toISOString?.() ?? null,
  });
}

export async function PUT(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Sin base de datos" }, { status: 503 });
  }
  const body = (await req.json()) as FinanceBundle;
  if (body?.version !== 2 || typeof body.years !== "object") {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const payload: FinanceBundle = {
    ...body,
    updatedAt: new Date().toISOString(),
  };
  const existing = await db
    .select()
    .from(schema.financeState)
    .where(eq(schema.financeState.id, ROW_ID))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(schema.financeState).values({
      id: ROW_ID,
      payload,
    });
  } else {
    await db
      .update(schema.financeState)
      .set({ payload, updatedAt: new Date() })
      .where(eq(schema.financeState.id, ROW_ID));
  }
  return NextResponse.json({ ok: true });
}
