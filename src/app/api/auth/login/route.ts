import { createSessionToken, isAuthEnabled, COOKIE_NAME } from "@/lib/auth-session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Autenticación no configurada" },
      { status: 400 },
    );
  }
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password ?? "";
  const expected = process.env.FINANCE_PASSWORD ?? "";
  if (password !== expected) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  let token: string;
  try {
    token = await createSessionToken();
  } catch {
    return NextResponse.json(
      { error: "Sesión no configurada (SESSION_SECRET)" },
      { status: 500 },
    );
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return res;
}
