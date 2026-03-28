import type { FinanceData, MonthIndex } from "./types";

/** Egresos y deudas con monto &gt; 0 en el mes (donde aplica el ✓ “pagado”). */
export function fixedOutflowSlots(data: FinanceData, month: MonthIndex) {
  return data.categories.filter(
    (c) =>
      (c.kind === "expense" || c.kind === "debt") && (c.byMonth[month] ?? 0) > 0,
  );
}

export function fixedOutflowPaidSummary(data: FinanceData, month: MonthIndex) {
  const slots = fixedOutflowSlots(data, month);
  const paid = slots.filter((c) => c.paidByMonth?.[month] === true).length;
  const total = slots.length;
  return {
    total,
    paid,
    unpaid: total - paid,
    allPaid: total === 0 || paid === total,
  };
}

/** Una entrada por mes con totales para filas tipo “3/4”. */
export function fixedOutflowPaidByAllMonths(data: FinanceData): {
  monthIndex: MonthIndex;
  paid: number;
  total: number;
}[] {
  const months: MonthIndex[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return months.map((monthIndex) => {
    const s = fixedOutflowPaidSummary(data, monthIndex);
    return { monthIndex, paid: s.paid, total: s.total };
  });
}

export const MONTH_REMINDER_DISMISS_KEY = "finanzas-month-reminder-dismissed";

/** `YYYY-MM` en hora local. */
export function calendarYearMonthKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function currentCalendarMonthIndex(d = new Date()): MonthIndex {
  return d.getMonth() as MonthIndex;
}
