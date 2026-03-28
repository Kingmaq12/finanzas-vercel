import { listEventsPendingNotification, markEventNotified } from "@/lib/household-server";
import { isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram-client";
import { NextResponse } from "next/server";

/**
 * Vercel Cron: define CRON_SECRET y (opcional) TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
 * Comprueba eventos futuros y envía un mensaje cuando se cumple la ventana (minutos antes).
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

  const events = await listEventsPendingNotification();
  const now = Date.now();
  let sent = 0;
  const errors: string[] = [];

  for (const ev of events) {
    const msBefore = (ev.notifyMinutesBefore ?? 1440) * 60_000;
    const notifyAt = ev.startsAt.getTime() - msBefore;
    if (now < notifyAt) continue;

    try {
      const textBody = [
        `📅 ${ev.title}`,
        `Cuándo: ${ev.startsAt.toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" })}`,
        ev.notes ? `Notas: ${ev.notes}` : "",
        "",
        "— Finanzas (hogar compartido)",
      ]
        .filter(Boolean)
        .join("\n");
      const result = await sendTelegramMessage(textBody);
      if (!result.ok) {
        errors.push(`${ev.id}: ${result.error}`);
        continue;
      }
      await markEventNotified(ev.id);
      sent += 1;
    } catch (e) {
      errors.push(`${ev.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    pending: events.length,
    sent,
    errors: errors.length ? errors : undefined,
  });
}
