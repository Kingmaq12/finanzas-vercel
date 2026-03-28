import { isAuthEnabled } from "@/lib/auth-session";
import { getServerSession } from "@/lib/server-session";
import {
  ensureSharedStateRow,
  getHouseholdIdForUser,
  upsertSharedPayload,
} from "@/lib/household-server";
import { isSharedHouseholdPayload } from "@/lib/shared-household-types";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Sin autenticación remota" }, { status: 503 });
  }
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const hid = await getHouseholdIdForUser(session.userId);
  if (!hid) {
    return NextResponse.json(
      { error: "Sin hogar compartido", code: "NO_HOUSEHOLD" },
      { status: 404 },
    );
  }
  const payload = await ensureSharedStateRow(hid);
  return NextResponse.json({ householdId: hid, payload });
}

export async function PUT(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Sin autenticación remota" }, { status: 503 });
  }
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const hid = await getHouseholdIdForUser(session.userId);
  if (!hid) {
    return NextResponse.json({ error: "Sin hogar compartido" }, { status: 404 });
  }
  const body = (await req.json()) as unknown;
  if (!isSharedHouseholdPayload(body)) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  await upsertSharedPayload(hid, body);
  return NextResponse.json({ ok: true });
}
