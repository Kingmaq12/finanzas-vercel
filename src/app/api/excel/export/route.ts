import {
  COOKIE_NAME,
  isAuthEnabled,
  verifySessionToken,
} from "@/lib/auth-session";
import { buildExcelBuffer } from "@/lib/excel-workbook";
import type { FinanceBundle } from "@/lib/types";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function requireAuth(): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  if (!c) return false;
  return verifySessionToken(c);
}

export async function POST(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    bundle?: FinanceBundle;
  } | null;
  const bundle = body?.bundle;
  if (!bundle || bundle.version !== 2) {
    return NextResponse.json({ error: "bundle requerido" }, { status: 400 });
  }
  const buffer = await buildExcelBuffer(bundle);
  const filename = `finanzas-${Object.keys(bundle.years).sort().join("-")}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
