"use client";

import { formatCop } from "@/lib/format";
import type { ExtraTransaction } from "@/lib/types";
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
import { useMemo } from "react";

export function MonthCharts({ transactions }: { transactions: ExtraTransaction[] }) {
  const byName = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of transactions) {
      const key = t.name.trim() || "Sin nombre";
      m.set(key, (m.get(key) ?? 0) + t.amount);
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name: name.length > 18 ? `${name.slice(0, 16)}…` : name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of transactions) {
      const d = t.date?.slice(0, 10) ?? "sin fecha";
      m.set(d, (m.get(d) ?? 0) + t.amount);
    }
    return [...m.entries()]
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-14);
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 text-center text-sm text-[var(--app-muted)]">
        Añade movimientos para ver gráficas por concepto y por día.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--app-muted)]">
          Top conceptos del mes
        </h2>
        <div className="mt-4 h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byName} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--app-border)]" />
              <XAxis type="number" tick={{ fontSize: 10 }} hide />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v) => formatCop(typeof v === "number" ? v : Number(v) || 0)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--app-border)",
                  fontSize: "12px",
                  background: "var(--app-card)",
                }}
              />
              <Bar dataKey="value" fill="#e11d48" radius={[0, 4, 4, 0]} name="Monto" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--app-muted)]">
          Gasto por día (últimos registros)
        </h2>
        <div className="mt-4 h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--app-border)]" />
              <XAxis dataKey="fecha" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={56} />
              <YAxis
                width={40}
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
              <Legend />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total día" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
