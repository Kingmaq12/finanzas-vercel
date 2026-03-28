import { Resend } from "resend";

/**
 * Usa `RESEND_API_KEY` y `RESEND_FROM_EMAIL` desde variables de entorno (Vercel / .env.local).
 * No pongas la clave en el código: en Resend Dashboard copias `re_...` y la pegas solo en el servidor.
 */
export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export function getResendFromEmail(): string | undefined {
  return process.env.RESEND_FROM_EMAIL?.trim() || undefined;
}

export async function sendResendEmail(params: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  const from = getResendFromEmail();
  if (!resend || !from) {
    return {
      ok: false,
      error: "Configura RESEND_API_KEY y RESEND_FROM_EMAIL en el entorno.",
    };
  }
  const body =
    params.html && params.text
      ? { html: params.html, text: params.text }
      : params.html
        ? { html: params.html }
        : params.text
          ? { text: params.text }
          : null;
  if (!body) {
    return { ok: false, error: "Indica html o text (o ambos)." };
  }

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    ...body,
  });

  if (error) {
    return { ok: false, error: typeof error === "string" ? error : JSON.stringify(error) };
  }
  return { ok: true };
}
