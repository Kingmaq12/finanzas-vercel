import { isAuthEnabled } from "@/lib/auth-session";
import { getServerSession } from "@/lib/server-session";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isAuthEnabled()) {
    return NextResponse.json({ authEnabled: false, authenticated: true, user: null });
  }
  const session = await getServerSession();
  return NextResponse.json({
    authEnabled: true,
    authenticated: Boolean(session),
    user: session ? { username: session.username, id: session.userId } : null,
  });
}
