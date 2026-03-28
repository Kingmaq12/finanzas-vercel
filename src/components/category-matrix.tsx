"use client";

import { useFinance } from "@/context/finance-context";
import { formatCop, parseAmountInput } from "@/lib/format";
import { MONTH_SHORT } from "@/lib/months";
import type { CategoryKind, MonthIndex } from "@/lib/types";
import { useMemo, useState } from "react";

function MonthInput({
  value,
  onChange,
  inputKey,
}: {
  value: number;
  onChange: (n: number) => void;
  /** Si el valor externo cambia, forzar remount con esta clave. */
  inputKey: string;
}) {
  return (
    <input
      key={inputKey}
      className="w-full min-w-[4.5rem] rounded border border-[var(--app-border)] bg-white px-1.5 py-1 text-right text-xs tabular-nums outline-none focus:border-[var(--app-accent)]"
      inputMode="numeric"
      defaultValue={value === 0 ? "" : String(Math.round(value))}
      onBlur={(e) => onChange(parseAmountInput(e.target.value))}
    />
  );
}

function Section({
  title,
  kind,
  hint,
}: {
  title: string;
  kind: CategoryKind;
  hint: string;
}) {
  const {
    data,
    setCategoryAmount,
    renameCategory,
    removeCategory,
    addCategory,
  } = useFinance();
  const rows = useMemo(
    () => data.categories.filter((c) => c.kind === kind),
    [data.categories, kind],
  );
  const [newName, setNewName] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-[var(--app-muted)]">{hint}</p>
        </div>
        <div className="flex gap-2">
          <input
            className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm"
            placeholder="Nueva línea…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              const n = newName.trim();
              if (!n) return;
              addCategory(n, kind);
              setNewName("");
            }}
          >
            Añadir
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-card)]">
        <table className="w-full min-w-[800px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--app-border)] bg-black/[0.02]">
              <th className="sticky left-0 z-10 bg-[var(--app-card)] px-3 py-2 text-left">
                Nombre
              </th>
              {MONTH_SHORT.map((m) => (
                <th key={m} className="px-1 py-2 text-right font-medium text-[var(--app-muted)]">
                  {m}
                </th>
              ))}
              <th className="px-2 py-2 text-right text-[var(--app-muted)]">Σ</th>
              <th className="w-10 px-1" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const total = Object.values(c.byMonth).reduce((a, b) => a + b, 0);
              return (
                <tr key={c.id} className="border-b border-[var(--app-border)]">
                  <td className="sticky left-0 z-10 bg-[var(--app-card)] px-2 py-1">
                    <input
                      className="w-full min-w-[8rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-sm outline-none focus:border-[var(--app-border)]"
                      value={c.name}
                      onChange={(e) => renameCategory(c.id, e.target.value)}
                    />
                  </td>
                  {MONTH_SHORT.map((_, mi) => (
                    <td key={mi} className="px-1 py-1">
                      <MonthInput
                        inputKey={`${c.id}-${mi}-${c.byMonth[mi as MonthIndex] ?? 0}`}
                        value={c.byMonth[mi as MonthIndex] ?? 0}
                        onChange={(n) => setCategoryAmount(c.id, mi as MonthIndex, n)}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1 text-right tabular-nums text-[var(--app-muted)]">
                    {formatCop(total)}
                  </td>
                  <td className="px-1">
                    <button
                      type="button"
                      className="text-rose-600 hover:underline"
                      title="Eliminar línea"
                      onClick={() => removeCategory(c.id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CategoryMatrix() {
  const { ready, data, setYearLabel } = useFinance();

  if (!ready) {
    return <p className="text-sm text-[var(--app-muted)]">Cargando…</p>;
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorías y montos</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
          Misma lógica que las filas de tu Excel en la hoja General: una fila por concepto y
          columnas por mes. El total de gastos adicionales lo cargas por mes en{" "}
          <strong>Por mes</strong>.
        </p>
        <label className="mt-4 flex max-w-xs flex-col gap-1 text-sm">
          <span className="text-[var(--app-muted)]">Etiqueta del año</span>
          <input
            className="rounded-lg border border-[var(--app-border)] px-3 py-2"
            value={data.yearLabel}
            onChange={(e) => setYearLabel(e.target.value)}
          />
        </label>
      </div>

      <Section
        title="Ingresos"
        kind="income"
        hint="Sueldo, ahorros que entran, etc."
      />
      <Section
        title="Egresos recurrentes"
        kind="expense"
        hint="Alquiler, servicios, aportes fijos…"
      />
      <Section title="Deudas" kind="debt" hint="Cuotas, SOAT, banco…" />
    </div>
  );
}
