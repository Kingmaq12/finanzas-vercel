"use client";

import type { MonthRollup } from "@/lib/aggregates";
import { yearlyTotals } from "@/lib/aggregates";
import { formatCop } from "@/lib/format";
import { MONTH_SHORT } from "@/lib/months";
import {
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function DashboardExtraCharts({ rollups }: { rollups: MonthRollup[] }) {
  const year = yearlyTotals(rollups);
  const totalOut = year.totalExpense + year.totalDebt + year.extraSpend;
  const pieData = [
    { name: "Ingresos", value: Math.max(0, year.totalIncome), fill: "#059669" },
    { name: "Salidas", value: Math.max(0, totalOut), fill: "#e11d48" },
  ].filter((d) => d.value > 0);

  const lineData = rollups.reduce<
    { mes: string; disponibleMes: number; acumulado: number }[]
  >((out, r, i) => {
    const acumulado = (i > 0 ? out[i - 1].acumulado : 0) + r.disponible;
    out.push({
      mes: MONTH_SHORT[r.monthIndex],
      disponibleMes: r.disponible,
      acumulado,
    });
    return out;
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--app-muted)]">
          Ingresos vs salidas (año)
        </h2>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          Vista proporcional del dinero que entra frente al que sale (egresos, deudas y adicionales).
        </p>
        <div className="mt-4 h-[220px] w-full min-w-0">
          {pieData.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--app-muted)]">Sin datos para graficar.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                />
                <Tooltip formatter={(v) => formatCop(Number(v) || 0)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--app-muted)]">
          Disponible acumulado
        </h2>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          Suma mes a mes del disponible; útil para ver la tendencia del año.
        </p>
        <div className="mt-4 h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis
                width={44}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) =>
                  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
                }
              />
              <Tooltip
                formatter={(v) => formatCop(typeof v === "number" ? v : Number(v) || 0)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--app-border)",
                  fontSize: "12px",
                  background: "var(--app-card)",
                }}
              />
              <Line
                type="monotone"
                dataKey="acumulado"
                name="Acumulado"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="disponibleMes"
                name="Mes"
                stroke="#94a3b8"
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
