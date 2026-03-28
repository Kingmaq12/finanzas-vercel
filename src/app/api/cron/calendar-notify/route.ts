import { listEventsPendingNotification, markEventNotified } from "@/lib/household-server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Vercel Cron: define CRON_SECRET y (opcional) RESEND_API_KEY + RESEND_FROM_EMAIL.
 * Comprueba eventos futuros y envía correo cuando se cumple la ventana (minutos antes).
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

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Configura RESEND_API_KEY y RESEND_FROM_EMAIL para enviar correos.",
    });
  }

  const resend = new Resend(apiKey);
  const events = await listEventsPendingNotification();
  const now = Date.now();
  let sent = 0;
  const errors: string[] = [];

  for (const ev of events) {
    const emails = (Array.isArray(ev.notifyEmails) ? ev.notifyEmails : []).filter(Boolean);
    if (emails.length === 0) continue;
    const msBefore = (ev.notifyMinutesBefore ?? 1440) * 60_000;
    const notifyAt = ev.startsAt.getTime() - msBefore;
    if (now < notifyAt) continue;

    try {
      const { error } = await resend.emails.send({
        from,
        to: emails,
        subject: `Recordatorio: ${ev.title}`,
        text: [
          `Evento: ${ev.title}`,
          `Cuándo: ${ev.startsAt.toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" })}`,
          ev.notes ? `Notas: ${ev.notes}` : "",
          "",
          "— Finanzas (hogar compartido)",
        ]
          .filter(Boolean)
          .join("\n"),
      });
      if (error) {
        errors.push(`${ev.id}: ${JSON.stringify(error)}`);
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
