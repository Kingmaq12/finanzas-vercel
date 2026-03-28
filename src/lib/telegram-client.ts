/**
 * Envío vía Bot API: `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en el servidor (Vercel / .env.local).
 * `TELEGRAM_CHAT_ID` puede ser varios IDs separados por coma o espacio (mismo mensaje a cada chat).
 *
 * El id de Telegram es un número (ej. `-5221614280` o `-100…`), del JSON de getUpdates — no un UUID de la app.
 */
function looksLikeAppUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s.trim(),
  );
}

export function getTelegramBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || undefined;
}

export function getTelegramChatIds(): string[] {
  const raw = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!raw) return [];
  return raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
}

export function isTelegramConfigured(): boolean {
  return Boolean(getTelegramBotToken() && getTelegramChatIds().length);
}

export async function sendTelegramMessage(
  text: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = getTelegramBotToken();
  const chatIds = getTelegramChatIds();
  if (!token || chatIds.length === 0) {
    return {
      ok: false,
      error: "Configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en el entorno.",
    };
  }
  const errors: string[] = [];
  for (const chatId of chatIds) {
    if (looksLikeAppUuid(chatId)) {
      errors.push(
        `TELEGRAM_CHAT_ID "${chatId}" parece un UUID (p. ej. id de un evento en la base de datos), no el chat de Telegram. Abre https://api.telegram.org/bot<TOKEN>/getUpdates y usa el número en "chat":{"id":…} (ej. -5221614280).`,
      );
      continue;
    }
    const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
    };
    if (!res.ok || !j.ok) {
      let msg = j.description ?? res.statusText;
      if (typeof msg === "string" && msg.toLowerCase().includes("chat not found")) {
        msg +=
          " — Suele ser TELEGRAM_CHAT_ID incorrecto (debe ser el id numérico de getUpdates) o el bot no está en ese grupo/canal.";
      }
      errors.push(msg);
    }
  }
  if (errors.length) {
    return { ok: false, error: errors.join("; ") };
  }
  return { ok: true };
}
