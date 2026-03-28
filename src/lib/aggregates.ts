import type { FinanceData, MonthIndex } from "./types";

export interface MonthRollup {
  monthIndex: MonthIndex;
  totalIncome: number;
  totalExpense: number;
  totalDebt: number;
  extraSpend: number;
  /** Ingresos − egresos categorizados (sin deudas ni extras). Alineado a “flujo” de presupuesto. */
  flowBeforeDebtAndExtra: number;
  /** Ingresos − egresos − deudas − gastos adicionales */
  disponible: number;
}

const MONTHS: MonthIndex[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function sumCategoryKind(
  data: FinanceData,
  month: MonthIndex,
  kind: "income" | "expense" | "debt",
): number {
  return data.categories
    .filter((c) => c.kind === kind)
    .reduce((s, c) => s + (c.byMonth[month] ?? 0), 0);
}

export function sumExtraForMonth(data: FinanceData, month: MonthIndex): number {
  return data.extraTransactions
    .filter((t) => t.monthIndex === month)
    .reduce((s, t) => s + t.amount, 0);
}

export function monthRollup(data: FinanceData, month: MonthIndex): MonthRollup {
  const totalIncome = sumCategoryKind(data, month, "income");
  const totalExpense = sumCategoryKind(data, month, "expense");
  const totalDebt = sumCategoryKind(data, month, "debt");
  const extraSpend = sumExtraForMonth(data, month);
  const flowBeforeDebtAndExtra = totalIncome - totalExpense;
  const disponible = totalIncome - totalExpense - totalDebt - extraSpend;
  return {
    monthIndex: month,
    totalIncome,
    totalExpense,
    totalDebt,
    extraSpend,
    flowBeforeDebtAndExtra,
    disponible,
  };
}

export function allMonthRollups(data: FinanceData): MonthRollup[] {
  return MONTHS.map((m) => monthRollup(data, m));
}

export function yearlyTotals(rollups: MonthRollup[]) {
  const sum = (k: keyof Pick<MonthRollup, "totalIncome" | "totalExpense" | "totalDebt" | "extraSpend" | "disponible">) =>
    rollups.reduce((s, r) => s + r[k], 0);
  return {
    totalIncome: sum("totalIncome"),
    totalExpense: sum("totalExpense"),
    totalDebt: sum("totalDebt"),
    extraSpend: sum("extraSpend"),
    disponible: sum("disponible"),
  };
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
