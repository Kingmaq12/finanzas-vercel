import { dispatchDueCalendarNotifications } from "@/lib/calendar-notify-dispatch";
import { listEventsPendingNotification } from "@/lib/household-server";
import { isTelegramConfigured } from "@/lib/telegram-client";
import { NextResponse } from "next/server";

/**
 * Vercel Cron (Hobby: como mucho 1×/día en vercel.json) o ping externo con el mismo Bearer.
 * Requiere CRON_SECRET y (para enviar) TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID para enviar avisos.",
    });
  }

  const rows = await listEventsPendingNotification();
  const events = rows.map((r) => ({
    id: r.id,
    title: r.title,
    startsAt: r.startsAt,
    notes: r.notes,
    notifyMinutesBefore: r.notifyMinutesBefore,
  }));

  const { sent, errors } = await dispatchDueCalendarNotifications(events);

  return NextResponse.json({
    ok: true,
    pending: events.length,
    sent,
    errors: errors.length ? errors : undefined,
  });
}
