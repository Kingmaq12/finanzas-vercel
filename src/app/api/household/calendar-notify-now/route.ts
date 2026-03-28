import {
  getHouseholdIdForUser,
  listEventsPendingNotificationForHousehold,
} from "@/lib/household-server";
import { dispatchDueCalendarNotifications } from "@/lib/calendar-notify-dispatch";
import { isAuthEnabled } from "@/lib/auth-session";
import { getServerSession } from "@/lib/server-session";
import { isTelegramConfigured } from "@/lib/telegram-client";
import { NextResponse } from "next/server";

/**
 * POST: ejecuta la misma lógica que el cron pero solo para el hogar del usuario.
 * Útil en plan Vercel Hobby (cron 1×/día) o para probar avisos de “X minutos antes”.
 */
export async function POST() {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Sin autenticación remota" }, { status: 503 });
  }
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hid = await getHouseholdIdForUser(session.userId);
  if (!hid) return NextResponse.json({ error: "Sin hogar" }, { status: 404 });

  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Telegram no configurado (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)." },
      { status: 503 },
    );
  }

  const rows = await listEventsPendingNotificationForHousehold(hid);
  const events = rows.map((r) => ({
    id: r.id,
    title: r.title,
    startsAt: r.startsAt,
    notes: r.notes,
    notifyMinutesBefore: r.notifyMinutesBefore,
  }));

  const nowMs = Date.now();
  let waitingForWindow = 0;
  for (const ev of events) {
    const msBefore = (ev.notifyMinutesBefore ?? 1440) * 60_000;
    const notifyAt = ev.startsAt.getTime() - msBefore;
    if (nowMs < notifyAt) waitingForWindow += 1;
  }

  const { sent, errors } = await dispatchDueCalendarNotifications(events, nowMs);

  return NextResponse.json({
    ok: true,
    pending: events.length,
    waitingForWindow,
    sent,
    errors: errors.length ? errors : undefined,
  });
}
