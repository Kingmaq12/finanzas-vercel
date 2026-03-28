import { isAuthEnabled } from "@/lib/auth-session";
import { getServerSession } from "@/lib/server-session";
import { sendResendEmail } from "@/lib/resend-client";
import { NextResponse } from "next/server";

/**
 * POST /api/email/test
 * Body opcional: { "to": "correo@ejemplo.com" }
 * Si omites `to`, usa RESEND_TEST_TO en el servidor.
 * Requiere sesión (misma protección que el resto de la app con auth).
 */
export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Autenticación remota no activa" }, { status: 400 });
  }
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { to?: string };
  const to =
    typeof body.to === "string" && body.to.includes("@")
      ? body.to.trim()
      : process.env.RESEND_TEST_TO?.trim();

  if (!to) {
    return NextResponse.json(
      {
        error:
          'Indica en el JSON el destino: { "to": "tu@correo.com" } o define RESEND_TEST_TO en el servidor.',
      },
      { status: 400 },
    );
  }

  const result = await sendResendEmail({
    to,
    subject: "Prueba Resend · Finanzas",
    html: "<p>Congrats on sending your <strong>first email</strong> from the app!</p>",
    text: "Prueba desde finanzas-vercel (Resend).",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, to });
}
