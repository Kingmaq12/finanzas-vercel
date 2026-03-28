import { isAuthEnabled } from "@/lib/auth-session";
import { getServerSession } from "@/lib/server-session";
import { buildExcelBuffer } from "@/lib/excel-workbook";
import type { FinanceBundle } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (isAuthEnabled()) {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
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
