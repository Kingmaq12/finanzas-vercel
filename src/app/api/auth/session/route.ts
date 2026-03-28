import { COOKIE_NAME, isAuthEnabled, verifySessionToken } from "@/lib/auth-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const authEnabled = isAuthEnabled();
  if (!authEnabled) {
    return NextResponse.json({ authEnabled: false, authenticated: true });
  }
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const authenticated = token ? await verifySessionToken(token) : false;
  return NextResponse.json({ authEnabled: true, authenticated });
}
