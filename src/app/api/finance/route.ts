import { getDb, schema } from "@/db";
import { isAuthEnabled } from "@/lib/auth-session";
import { getServerSession } from "@/lib/server-session";
import type { FinanceBundle } from "@/lib/types";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Sin base de datos para sync" }, { status: 503 });
  }
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Sin base de datos" }, { status: 503 });
  }
  const rows = await db
    .select()
    .from(schema.financeState)
    .where(eq(schema.financeState.userId, session.userId))
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
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Sin base de datos para sync" }, { status: 503 });
  }
  const session = await getServerSession();
  if (!session) {
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
    .where(eq(schema.financeState.userId, session.userId))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(schema.financeState).values({
      userId: session.userId,
      payload,
    });
  } else {
    await db
      .update(schema.financeState)
      .set({ payload, updatedAt: new Date() })
      .where(eq(schema.financeState.userId, session.userId));
  }
  return NextResponse.json({ ok: true });
}
