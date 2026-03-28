import { householdCalendarEvents } from "@/db/schema";
import { getDb } from "@/db";
import { isAuthEnabled } from "@/lib/auth-session";
import { getServerSession } from "@/lib/server-session";
import { getHouseholdIdForUser, listCalendarEvents } from "@/lib/household-server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export async function GET() {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Sin autenticación remota" }, { status: 503 });
  }
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const hid = await getHouseholdIdForUser(session.userId);
  if (!hid) return NextResponse.json({ error: "Sin hogar" }, { status: 404 });
  const events = await listCalendarEvents(hid);
  return NextResponse.json({ events });
}

type CreateBody = {
  title?: string;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
  notifyEnabled?: boolean;
  notifyEmails?: string[];
  notifyMinutesBefore?: number;
};

export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Sin autenticación remota" }, { status: 503 });
  }
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const hid = await getHouseholdIdForUser(session.userId);
  if (!hid) return NextResponse.json({ error: "Sin hogar" }, { status: 404 });
  const body = (await req.json()) as CreateBody;
  if (!body.title?.trim() || !body.startsAt) {
    return NextResponse.json({ error: "title y startsAt requeridos" }, { status: 400 });
  }
  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "startsAt inválido" }, { status: 400 });
  }
  const endsAt = body.endsAt ? new Date(body.endsAt) : null;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Sin DB" }, { status: 503 });
  const id = randomUUID();
  const emails = Array.isArray(body.notifyEmails)
    ? body.notifyEmails.map((e) => e.trim()).filter(Boolean)
    : [];
  await db.insert(householdCalendarEvents).values({
    id,
    householdId: hid,
    title: body.title.trim(),
    startsAt,
    endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt : null,
    notes: body.notes?.trim() || null,
    notifyEnabled: Boolean(body.notifyEnabled),
    notifyEmails: emails,
    notifyMinutesBefore:
      typeof body.notifyMinutesBefore === "number" && body.notifyMinutesBefore >= 0
        ? body.notifyMinutesBefore
        : 1440,
    lastNotifiedAt: null,
  });
  return NextResponse.json({ ok: true, id });
}

type PatchBody = CreateBody & { id?: string };

export async function PATCH(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Sin autenticación remota" }, { status: 503 });
  }
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const hid = await getHouseholdIdForUser(session.userId);
  if (!hid) return NextResponse.json({ error: "Sin hogar" }, { status: 404 });
  const body = (await req.json()) as PatchBody;
  if (!body.id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Sin DB" }, { status: 503 });
  const existing = await db
    .select()
    .from(householdCalendarEvents)
    .where(eq(householdCalendarEvents.id, body.id))
    .limit(1);
  const row = existing[0];
  if (!row || row.householdId !== hid) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (body.startsAt !== undefined) {
    const d = new Date(body.startsAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "startsAt inválido" }, { status: 400 });
    }
  }
  await db
    .update(householdCalendarEvents)
    .set({
      title: body.title !== undefined ? body.title.trim() : row.title,
      startsAt:
        body.startsAt !== undefined ? new Date(body.startsAt) : row.startsAt,
      endsAt:
        body.endsAt !== undefined
          ? body.endsAt
            ? new Date(body.endsAt)
            : null
          : row.endsAt,
      notes: body.notes !== undefined ? body.notes?.trim() || null : row.notes,
      notifyEnabled:
        body.notifyEnabled !== undefined ? Boolean(body.notifyEnabled) : row.notifyEnabled,
      notifyEmails:
        body.notifyEmails !== undefined
          ? Array.isArray(body.notifyEmails)
            ? body.notifyEmails.map((e) => e.trim()).filter(Boolean)
            : []
          : row.notifyEmails,
      notifyMinutesBefore:
        body.notifyMinutesBefore !== undefined &&
        typeof body.notifyMinutesBefore === "number" &&
        body.notifyMinutesBefore >= 0
          ? body.notifyMinutesBefore
          : row.notifyMinutesBefore,
    })
    .where(eq(householdCalendarEvents.id, body.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Sin autenticación remota" }, { status: 503 });
  }
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const hid = await getHouseholdIdForUser(session.userId);
  if (!hid) return NextResponse.json({ error: "Sin hogar" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Sin DB" }, { status: 503 });
  const existing = await db
    .select()
    .from(householdCalendarEvents)
    .where(eq(householdCalendarEvents.id, id))
    .limit(1);
  if (!existing[0] || existing[0].householdId !== hid) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  await db.delete(householdCalendarEvents).where(eq(householdCalendarEvents.id, id));
  return NextResponse.json({ ok: true });
}
