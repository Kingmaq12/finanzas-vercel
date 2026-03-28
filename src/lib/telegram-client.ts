/**
 * Envío vía Bot API: `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en el servidor (Vercel / .env.local).
 * `TELEGRAM_CHAT_ID` puede ser varios IDs separados por coma o espacio (mismo mensaje a cada chat).
 */
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
      errors.push(j.description ?? res.statusText);
    }
  }
  if (errors.length) {
    return { ok: false, error: errors.join("; ") };
  }
  return { ok: true };
}
