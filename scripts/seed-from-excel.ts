/**
 * Importa el Excel de gastos al bundle y hace upsert en Neon (finance_state).
 * Uso: npx tsx scripts/seed-from-excel.ts [ruta/al/archivo.xlsx]
 * Requiere DATABASE_URL en .env.local
 */

import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { eq } from "drizzle-orm";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { getDb, schema } from "../src/db/index";
import { createDefaultBundle } from "../src/lib/default-state";
import type { ExtraTransaction, FinanceBundle, MonthIndex } from "../src/lib/types";

const ROW_ID = "default";

const MONTH_SHEETS: Record<string, MonthIndex> = {
  Ene: 0,
  Feb: 1,
  Mar: 2,
  Abr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Ago: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dic: 11,
};

function loadEnvLocal(): void {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) {
    console.error("No se encontró .env.local (define DATABASE_URL).");
    process.exit(1);
  }
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function cellNum(cell: ExcelJS.Cell): number {
  const v = cell.value;
  if (v == null || v === "") return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === "object" && v !== null && "result" in v) {
    const r = (v as { result?: number }).result;
    return typeof r === "number" ? r : 0;
  }
  return 0;
}

function matchCategoryId(label: string): string | null {
  const n = norm(label);
  if (!n || n.includes("total")) return null;
  if (
    n === "ingresos" ||
    n === "egresos" ||
    n === "deudas" ||
    n.includes("gastos adicionales") ||
    n === "gastos"
  ) {
    return null;
  }
  const rules: [string, string][] = [
    ["sueldo", "inc-sueldo"],
    ["ahorro sin guardar", "inc-ahorros"],
    ["retiro", "inc-retiro"],
    ["ahorro apto", "eg-ahorro-apto"],
    ["inversiones", "eg-inv"],
    ["mama", "eg-mama"],
    ["alquiler", "eg-alquiler"],
    ["servicios", "eg-servicios"],
    ["comida", "eg-comida"],
    ["decameron", "eg-decameron"],
    ["gym", "eg-gym"],
    ["soat", "db-soat"],
    ["bancolombia", "db-banco"],
  ];
  for (const [needle, id] of rules) {
    if (n.includes(needle)) return id;
  }
  return null;
}

function parseFecha(raw: string): string | undefined {
  const s = raw.trim();
  if (!s) return undefined;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(-?\d+)/);
  if (!m) return undefined;
  let year = parseInt(m[3], 10);
  if (year < 0) year = 2000 + Math.abs(year);
  else if (year < 100) year += 2000;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const d = new Date(year, month, day);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function newId(): string {
  return randomUUID();
}

async function main(): Promise<void> {
  loadEnvLocal();
  const db = getDb();
  if (!db) {
    console.error("DATABASE_URL no definida o getDb() devolvió null.");
    process.exit(1);
  }

  const xlsxPath =
    process.argv[2] ||
    resolve(process.cwd(), "../Reporte de Gastos Ene-26 _ Dic-26.xlsx");

  if (!existsSync(xlsxPath)) {
    console.error("No existe el archivo:", xlsxPath);
    process.exit(1);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);

  const bundle = createDefaultBundle();
  const y2026 = bundle.years["2026"];
  if (!y2026) {
    console.error("Bundle sin año 2026");
    process.exit(1);
  }

  const gen = workbook.getWorksheet("General");
  if (!gen) {
    console.error('No se encontró la hoja "General".');
    process.exit(1);
  }

  for (let r = 8; r <= 40; r++) {
    const row = gen.getRow(r);
    const label = String(row.getCell(1).value ?? "").trim();
    if (!label) continue;
    const id = matchCategoryId(label);
    if (!id) continue;
    const cat = y2026.categories.find((c) => c.id === id);
    if (!cat) continue;
    for (let m = 0; m < 12; m++) {
      const col = m + 2;
      cat.byMonth[m as MonthIndex] = cellNum(row.getCell(col));
    }
  }

  const extras: Omit<ExtraTransaction, "id">[] = [];
  for (const [sheetName, monthIndex] of Object.entries(MONTH_SHEETS)) {
    const ws = workbook.getWorksheet(sheetName);
    if (!ws) continue;
    for (let rowNum = 3; rowNum <= 400; rowNum++) {
      const row = ws.getRow(rowNum);
      const name = String(row.getCell(1).value ?? "").trim();
      if (!name) continue;
      const nl = name.toLowerCase();
      if (nl === "nombre") continue;
      if (nl.startsWith("total")) break;
      const amount = cellNum(row.getCell(2));
      const fechaRaw = String(row.getCell(3).value ?? "").trim();
      extras.push({
        monthIndex,
        name,
        amount,
        date: parseFecha(fechaRaw),
      });
    }
  }

  y2026.extraTransactions = extras.map((t) => ({ ...t, id: newId() }));

  const payload: FinanceBundle = {
    ...bundle,
    activeYearKey: "2026",
    updatedAt: new Date().toISOString(),
  };

  const existing = await db
    .select()
    .from(schema.financeState)
    .where(eq(schema.financeState.id, ROW_ID))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(schema.financeState).values({
      id: ROW_ID,
      payload,
    });
  } else {
    await db
      .update(schema.financeState)
      .set({ payload, updatedAt: new Date() })
      .where(eq(schema.financeState.id, ROW_ID));
  }

  console.log("Listo. Filas categorías 2026 +", extras.length, "movimientos extra.");
  console.log("Neon actualizado (id=default). Abre la app en Vercel y recarga.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
