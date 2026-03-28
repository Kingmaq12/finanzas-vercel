import { isAuthEnabled } from "@/lib/auth-session";
import { getServerSession } from "@/lib/server-session";
import { sendTelegramMessage } from "@/lib/telegram-client";
import { NextResponse } from "next/server";

/**
 * POST /api/telegram/test
 * Requiere sesión (misma protección que el resto de la app con auth).
 */
export async function POST() {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Autenticación remota no activa" }, { status: 400 });
  }
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await sendTelegramMessage(
    "Prueba · Finanzas (recordatorios de calendario).",
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
