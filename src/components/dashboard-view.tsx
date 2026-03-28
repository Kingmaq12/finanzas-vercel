"use client";

import { allMonthRollups, average, yearlyTotals } from "@/lib/aggregates";
import { fixedOutflowPaidByAllMonths } from "@/lib/fixed-expense-paid";
import { formatCop } from "@/lib/format";
import { MONTH_SHORT } from "@/lib/months";
import { useFinance } from "@/context/finance-context";
import { motion } from "framer-motion";
import { DashboardExtraCharts } from "./dashboard-extra-charts";
import { FlowChart } from "./flow-chart";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 380, damping: 28 },
  },
};

export function DashboardView() {
  const { ready, data } = useFinance();
  const rollups = allMonthRollups(data);
  const year = yearlyTotals(rollups);
  const avgDisp = average(rollups.map((r) => r.disponible));
  const fixedPaidRow = fixedOutflowPaidByAllMonths(data);

  if (!ready) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-64 rounded-lg bg-[var(--app-border)]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-[var(--app-border)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Reporte {data.yearLabel}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
          Resumen anual y varias vistas. El ✓ verde es solo en <strong>Egresos recurrentes</strong>.
        </p>
      </motion.div>

      <motion.section
        className="grid gap-4 sm:grid-cols-3"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={item}
          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
            Ingresos (año)
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-700">
            {formatCop(year.totalIncome)}
          </p>
        </motion.div>
        <motion.div
          variants={item}
          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
            Egresos + deudas + adicionales
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-rose-700">
            {formatCop(year.totalExpense + year.totalDebt + year.extraSpend)}
          </p>
        </motion.div>
        <motion.div
          variants={item}
          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
            Disponible (año) · prom. mensual
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-indigo-700">
            {formatCop(year.disponible)}
          </p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Promedio: {formatCop(avgDisp)}
          </p>
        </motion.div>
      </motion.section>

      <motion.section
        className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--app-muted)]">
          Flujo mensual
        </h2>
        <div className="mt-4 min-h-[280px] min-w-0 w-full sm:min-h-[320px]">
          <FlowChart rollups={rollups} />
        </div>
      </motion.section>

      <DashboardExtraCharts rollups={rollups} />

      <section className="overflow-x-auto rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--app-border)] bg-black/[0.02] text-left text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
              <th className="sticky left-0 z-10 bg-[var(--app-card)] px-4 py-3">Concepto</th>
              {MONTH_SHORT.map((m) => (
                <th key={m} className="px-2 py-3 text-right font-medium">
                  {m}
                </th>
              ))}
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-right">Prom.</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--app-border)] bg-emerald-50/50 text-xs dark:bg-emerald-950/25">
              <td className="sticky left-0 z-10 bg-emerald-50/95 px-4 py-2.5 whitespace-nowrap backdrop-blur-[2px] dark:bg-emerald-950/40">
                Egresos fijos ✓ (recurrentes)
              </td>
              {fixedPaidRow.map(({ monthIndex, paid, total }) => (
                <td
                  key={monthIndex}
                  className={`px-2 py-2.5 text-right tabular-nums ${
                    total === 0
                      ? "text-[var(--app-muted)]"
                      : paid === total
                        ? "font-medium text-emerald-700"
                        : "text-amber-800"
                  }`}
                >
                  {total === 0 ? "—" : `${paid}/${total}`}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right tabular-nums text-[var(--app-muted)]">—</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-[var(--app-muted)]">—</td>
            </tr>
            {[
              { label: "Ingresos", pick: (r: (typeof rollups)[0]) => r.totalIncome },
              {
                label: "Total egresos (categorías)",
                pick: (r: (typeof rollups)[0]) => r.totalExpense,
              },
              { label: "Deudas", pick: (r: (typeof rollups)[0]) => r.totalDebt },
              {
                label: "Gastos adicionales",
                pick: (r: (typeof rollups)[0]) => r.extraSpend,
              },
              {
                label: "Disponible",
                pick: (r: (typeof rollups)[0]) => r.disponible,
                strong: true,
              },
            ].map((row) => {
              const totals = rollups.map(row.pick);
              const sum = totals.reduce((a, b) => a + b, 0);
              const prom = sum / 12;
              return (
                <tr
                  key={row.label}
                  className={`border-b border-[var(--app-border)] ${
                    row.strong ? "bg-indigo-50/80 font-medium" : ""
                  }`}
                >
                  <td className="sticky left-0 z-10 bg-[var(--app-card)] px-4 py-2.5 whitespace-nowrap">
                    {row.label}
                  </td>
                  {totals.map((v, i) => (
                    <td key={i} className="px-2 py-2.5 text-right tabular-nums text-[var(--app-fg)]">
                      {formatCop(v)}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatCop(sum)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[var(--app-muted)]">
                    {formatCop(prom)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
