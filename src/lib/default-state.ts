import type { CategoryLine, FinanceData, FinanceBundle, MonthIndex } from "./types";

export const PLAN_YEAR_START = 2026;
export const PLAN_YEAR_END = 2030;

const z = (): Record<MonthIndex, number> => ({
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
});

function cat(
  id: string,
  name: string,
  kind: CategoryLine["kind"],
  byMonth?: Partial<Record<MonthIndex, number>>,
): CategoryLine {
  return {
    id,
    name,
    kind,
    byMonth: { ...z(), ...byMonth },
    paidByMonth: {},
  };
}

/** Plantilla vacía alineada con las secciones de tu Excel (nombres editables en la app). */
export function createDefaultFinanceData(): FinanceData {
  return {
    version: 1,
    yearLabel: "2026",
    categories: [
      cat("inc-sueldo", "Sueldo", "income"),
      cat("inc-ahorros", "Ahorros sin guardar", "income"),
      cat("inc-retiro", "Retiro ahorro / protección", "income"),
      cat("eg-ahorro-apto", "Ahorro apto", "expense"),
      cat("eg-inv", "Inversiones", "expense"),
      cat("eg-mama", "Mamá", "expense"),
      cat("eg-alquiler", "Alquiler", "expense"),
      cat("eg-servicios", "Servicios", "expense"),
      cat("eg-comida", "Comida", "expense"),
      cat("eg-decameron", "Decameron / viajes planeados", "expense"),
      cat("eg-gym", "Gym", "expense"),
      cat("db-soat", "SOAT + impuesto anual carro", "debt"),
      cat("db-banco", "Pago Bancolombia / créditos", "debt"),
    ],
    extraTransactions: [],
    projects: [],
  };
}

/** Años 2026–2030 precreados; cada uno con la misma estructura de categorías. */
export function createDefaultBundle(): FinanceBundle {
  const years: Record<string, FinanceData> = {};
  for (let y = PLAN_YEAR_START; y <= PLAN_YEAR_END; y++) {
    const key = String(y);
    const d = createDefaultFinanceData();
    d.yearLabel = key;
    years[key] = d;
  }
  return {
    version: 2,
    activeYearKey: String(PLAN_YEAR_START),
    years,
    updatedAt: new Date().toISOString(),
  };
}
