"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCop } from "@/lib/format";
import { MONTH_SHORT } from "@/lib/months";
import type { MonthRollup } from "@/lib/aggregates";

export function FlowChart({ rollups }: { rollups: MonthRollup[] }) {
  const data = rollups.map((r) => ({
    mes: MONTH_SHORT[r.monthIndex],
    Ingresos: r.totalIncome,
    Egresos: r.totalExpense + r.totalDebt + r.extraSpend,
    Disponible: r.disponible,
  }));

  return (
    <div className="h-[min(320px,50vh)] min-h-[240px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--app-border)]" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "var(--app-muted)" }}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
            }
            width={48}
            tick={{ fontSize: 11, fill: "var(--app-muted)" }}
          />
          <Tooltip
            formatter={(value) =>
              formatCop(typeof value === "number" ? value : Number(value) || 0)
            }
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--app-border)",
              fontSize: "12px",
              background: "var(--app-card)",
              color: "var(--app-fg)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="Ingresos" fill="#059669" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Egresos" fill="#e11d48" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Disponible" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
