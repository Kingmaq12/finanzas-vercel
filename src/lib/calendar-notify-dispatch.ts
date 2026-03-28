import { markEventNotified } from "@/lib/household-server";
import { sendTelegramMessage } from "@/lib/telegram-client";

export type CalendarEventNotifyRow = {
  id: string;
  title: string;
  startsAt: Date;
  notes: string | null;
  notifyMinutesBefore: number | null;
};

/** Envía Telegram para cada evento cuya ventana de aviso ya abrió y el evento aún no ha empezado. */
export async function dispatchDueCalendarNotifications(
  events: CalendarEventNotifyRow[],
  nowMs: number = Date.now(),
): Promise<{ sent: number; errors: string[] }> {
  let sent = 0;
  const errors: string[] = [];

  for (const ev of events) {
    const msBefore = (ev.notifyMinutesBefore ?? 1440) * 60_000;
    const notifyAt = ev.startsAt.getTime() - msBefore;
    if (nowMs < notifyAt) continue;
    if (nowMs >= ev.startsAt.getTime()) continue;

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

  return { sent, errors };
}
