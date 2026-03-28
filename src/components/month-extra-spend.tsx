"use client";

import { monthRollup } from "@/lib/aggregates";
import { useFinance } from "@/context/finance-context";
import { formatCop, parseAmountInput } from "@/lib/format";
import { MONTH_SHORT, monthIndexToSlug } from "@/lib/months";
import type { MonthIndex } from "@/lib/types";
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

  if (!ready) {
    return <p className="text-sm text-[var(--app-muted)]">Cargando…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gastos adicionales · {MONTH_SHORT[monthIndex]}
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Como la hoja mensual de tu Excel: nombre, valor y fecha opcional.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {MONTH_SHORT.map((_, i) => (
            <Link
              key={i}
              href={`/mes/${monthIndexToSlug(i as MonthIndex)}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i === monthIndex
                  ? "bg-[var(--app-accent)] text-white"
                  : "border border-[var(--app-border)] bg-white hover:bg-black/[0.03]"
              }`}
            >
              {MONTH_SHORT[i]}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
            Suma gastos adicionales
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-rose-700">
            {formatCop(rollup.extraSpend)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
            Disponible mes
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-indigo-700">
            {formatCop(rollup.disponible)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6">
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
            className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm"
            placeholder="Nombre / concepto"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm"
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
          <button
            type="submit"
            className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Añadir
          </button>
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
                <tr key={t.id} className="border-b border-[var(--app-border)]">
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
                      className="text-rose-600 hover:underline"
                      onClick={() => removeExtraTransaction(t.id)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
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
