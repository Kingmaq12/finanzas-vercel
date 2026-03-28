"use client";

import { monthRollup } from "@/lib/aggregates";
import { useFinance } from "@/context/finance-context";
import { fixedOutflowPaidSummary } from "@/lib/fixed-expense-paid";
import { formatCop, parseAmountInput } from "@/lib/format";
import { MONTH_SHORT, monthIndexToSlug } from "@/lib/months";
import type { MonthIndex } from "@/lib/types";
import { motion } from "framer-motion";
import { MonthCharts } from "@/components/month-charts";
import Link from "next/link";
import { useMemo, useState } from "react";

export function MonthExtraSpend({ monthIndex }: { monthIndex: MonthIndex }) {
  const {
    ready,
    data,
    addExtraTransaction,
    updateExtraTransaction,
    removeExtraTransaction,
  } = useFinance();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const list = useMemo(
    () => data.extraTransactions.filter((t) => t.monthIndex === monthIndex),
    [data.extraTransactions, monthIndex],
  );

  const rollup = monthRollup(data, monthIndex);
  const fixedPaid = fixedOutflowPaidSummary(data, monthIndex);

  if (!ready) {
    return <p className="text-sm text-[var(--app-muted)]">Cargando…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            Gastos adicionales · {MONTH_SHORT[monthIndex]}
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Registro rápido del día a día. Los gastos fijos con ✓ van en{" "}
            <strong>Egresos recurrentes</strong> (Categorías).
          </p>
        </motion.div>
        <div className="flex flex-wrap gap-2">
          {MONTH_SHORT.map((_, i) => (
            <Link
              key={i}
              href={`/mes/${monthIndexToSlug(i as MonthIndex)}`}
              className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 active:scale-95 ${
                i === monthIndex
                  ? "bg-[var(--app-accent)] text-white shadow-md"
                  : "border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-accent-soft)]"
              }`}
            >
              {MONTH_SHORT[i]}
            </Link>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring" as const, stiffness: 380, damping: 30 }}
        className={`rounded-xl border px-4 py-3 shadow-sm ${
          fixedPaid.total === 0
            ? "border-[var(--app-border)] bg-[var(--app-card)]"
            : fixedPaid.allPaid
              ? "border-emerald-200 bg-emerald-50/80"
              : "border-amber-200 bg-amber-50/70"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
              Gastos fijos este mes (tabla Categorías)
            </p>
            <p className="mt-1 text-sm text-[var(--app-fg)]">
              {fixedPaid.total === 0 ? (
                <>
                  No hay egresos recurrentes con monto en{" "}
                  <strong>{MONTH_SHORT[monthIndex]}</strong>. Configúralos en{" "}
                  <strong>Categorías</strong> si aplica.
                </>
              ) : (
                <>
                  ✓ en egresos recurrentes:{" "}
                  <strong
                    className={
                      fixedPaid.allPaid ? "text-emerald-700 dark:text-emerald-400" : "text-amber-900 dark:text-amber-200"
                    }
                  >
                    {fixedPaid.paid}/{fixedPaid.total}
                  </strong>
                  {fixedPaid.allPaid
                    ? " — todo al día."
                    : " — marca el ✓ pequeño al pagar cada uno."}
                </>
              )}
            </p>
          </div>
          <Link
            href="/categorias#categorias-egresos"
            className="shrink-0 rounded-lg bg-[var(--app-accent)] px-3 py-2 text-center text-xs font-medium text-white shadow-sm transition-transform active:scale-[0.98] hover:opacity-95"
          >
            Ver / marcar ✓
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 shadow-sm"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
            Suma gastos adicionales
          </p>
          <motion.p
            key={rollup.extraSpend}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-xl font-semibold tabular-nums text-rose-700"
          >
            {formatCop(rollup.extraSpend)}
          </motion.p>
        </motion.div>
        <motion.div
          className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 shadow-sm"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.05 }}
        >
          <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
            Disponible mes
          </p>
          <motion.p
            key={rollup.disponible}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-xl font-semibold tabular-nums text-indigo-700"
          >
            {formatCop(rollup.disponible)}
          </motion.p>
        </motion.div>
      </div>

      <MonthCharts transactions={list} />

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Registrar movimiento</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_140px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseAmountInput(amount);
            if (!name.trim() || n === 0) return;
            addExtraTransaction({
              monthIndex,
              name: name.trim(),
              amount: n,
              date: date || undefined,
            });
            setName("");
            setAmount("");
            setDate("");
          }}
        >
          <input
            className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm transition-shadow focus:ring-2 focus:ring-[var(--app-accent-soft)]"
            placeholder="Nombre / concepto"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm transition-shadow focus:ring-2 focus:ring-[var(--app-accent-soft)]"
            placeholder="Valor"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.96 }}
            className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-shadow hover:shadow-md"
          >
            Añadir
          </motion.button>
        </form>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--app-border)] text-left text-xs uppercase text-[var(--app-muted)]">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4 text-right">Valor</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="w-10 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <motion.tr
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="border-b border-[var(--app-border)]"
                >
                  <td className="py-2 pr-2">
                    <input
                      className="w-full min-w-[10rem] rounded border border-transparent px-1 py-0.5 outline-none focus:border-[var(--app-border)]"
                      value={t.name}
                      onChange={(e) =>
                        updateExtraTransaction(t.id, { name: e.target.value })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <input
                      className="w-full rounded border border-[var(--app-border)] px-2 py-1 text-right tabular-nums"
                      inputMode="numeric"
                      defaultValue={String(Math.round(t.amount))}
                      key={t.amount}
                      onBlur={(e) =>
                        updateExtraTransaction(t.id, {
                          amount: parseAmountInput(e.target.value),
                        })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="date"
                      className="rounded border border-[var(--app-border)] px-2 py-1 text-xs"
                      value={t.date?.slice(0, 10) ?? ""}
                      onChange={(e) =>
                        updateExtraTransaction(t.id, {
                          date: e.target.value || undefined,
                        })
                      }
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      className="text-rose-600 transition-colors hover:text-rose-800"
                      onClick={() => removeExtraTransaction(t.id)}
                    >
                      Quitar
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--app-muted)]">
              No hay movimientos este mes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
