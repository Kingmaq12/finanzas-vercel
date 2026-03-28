"use client";

import { allMonthRollups, average, yearlyTotals } from "@/lib/aggregates";
import { formatCop } from "@/lib/format";
import { MONTH_SHORT } from "@/lib/months";
import { useFinance } from "@/context/finance-context";
import { FlowChart } from "./flow-chart";

export function DashboardView() {
  const { ready, data } = useFinance();
  const rollups = allMonthRollups(data);
  const year = yearlyTotals(rollups);
  const avgDisp = average(rollups.map((r) => r.disponible));

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Reporte {data.yearLabel}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
          Vista equivalente a tu hoja General: totales por mes, disponible y gráfico de
          flujo. Con base de datos en Vercel, los cambios se guardan también en la nube.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
            Ingresos (año)
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-700">
            {formatCop(year.totalIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
            Egresos + deudas + adicionales
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-rose-700">
            {formatCop(year.totalExpense + year.totalDebt + year.extraSpend)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
            Disponible (año) · prom. mensual
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-indigo-700">
            {formatCop(year.disponible)}
          </p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Promedio: {formatCop(avgDisp)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--app-muted)]">
          Flujo mensual
        </h2>
        <div className="mt-4 min-h-[280px] min-w-0 w-full sm:min-h-[320px]">
          <FlowChart rollups={rollups} />
        </div>
      </section>

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
