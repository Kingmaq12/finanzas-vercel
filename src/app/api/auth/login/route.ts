import { createSessionToken, COOKIE_NAME, isAuthEnabled } from "@/lib/auth-session";
import { verifyUserPassword } from "@/lib/auth-users";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Autenticación no configurada (DATABASE_URL + SESSION_SECRET)" },
      { status: 400 },
    );
  }
  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;
  const username = body?.username ?? "";
  const password = body?.password ?? "";
  const user = await verifyUserPassword(username, password);
  if (!user) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }
  let token: string;
  try {
    token = await createSessionToken({ userId: user.userId, username: user.username });
  } catch {
    return NextResponse.json(
      { error: "Sesión no configurada (SESSION_SECRET)" },
      { status: 500 },
    );
  }
  const res = NextResponse.json({ ok: true, username: user.username });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return res;
}
