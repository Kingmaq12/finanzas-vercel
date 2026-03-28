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
  inputKey: string;
}) {
  return (
    <input
      key={inputKey}
      className="w-full min-w-[3.5rem] rounded border border-[var(--app-border)] bg-[var(--app-input-bg)] px-1 py-1 text-right text-xs tabular-nums outline-none transition-shadow duration-200 focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]"
      inputMode="numeric"
      defaultValue={value === 0 ? "" : String(Math.round(value))}
      onBlur={(e) => onChange(parseAmountInput(e.target.value))}
    />
  );
}

function PaidToggle({ paid, onToggle }: { paid: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={paid}
      title="Gasto fijo pagado este mes"
      onClick={onToggle}
      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border text-[9px] font-bold transition-colors sm:h-5 sm:w-5 ${
        paid
          ? "border-emerald-600 bg-emerald-500 text-white shadow-sm"
          : "border-[var(--app-border)] bg-[var(--app-input-bg)] text-[var(--app-muted)] hover:border-emerald-400 hover:text-emerald-600"
      }`}
    >
      <span className="leading-none">{paid ? "✓" : ""}</span>
    </button>
  );
}

function Section({
  title,
  kind,
  hint,
  id,
  showPaidColumn,
}: {
  title: string;
  kind: CategoryKind;
  hint: string;
  id?: string;
  /** Solo egresos recurrentes: ✓ y celda verde. */
  showPaidColumn?: boolean;
}) {
  const {
    data,
    setCategoryAmount,
    toggleCategoryPaid,
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
    <div id={id} className="scroll-mt-24 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-[var(--app-muted)]">{hint}</p>
        </div>
        <div className="flex gap-2">
          <input
            className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm transition-shadow focus:ring-2 focus:ring-[var(--app-accent-soft)]"
            placeholder="Nueva línea…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white transition-transform active:scale-95"
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
      <div className="overflow-x-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] shadow-sm">
        <table className="w-full min-w-[880px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--app-border)] bg-black/[0.02]">
              <th className="sticky left-0 z-10 bg-[var(--app-card)] px-3 py-2 text-left">
                Nombre
              </th>
              {MONTH_SHORT.map((m) => (
                <th key={m} className="px-0.5 py-2 text-center font-medium text-[var(--app-muted)]">
                  <div>{m}</div>
                  {showPaidColumn ? (
                    <div className="mt-0.5 text-[8px] font-normal text-emerald-700/80 dark:text-emerald-400/90">
                      ✓
                    </div>
                  ) : null}
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
                <tr
                  key={c.id}
                  className="border-b border-[var(--app-border)] transition-colors hover:bg-black/[0.015]"
                >
                  <td className="sticky left-0 z-10 bg-[var(--app-card)] px-2 py-1.5">
                    <input
                      className="w-full min-w-[8rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-sm outline-none transition-colors focus:border-[var(--app-border)]"
                      value={c.name}
                      onChange={(e) => renameCategory(c.id, e.target.value)}
                    />
                  </td>
                  {MONTH_SHORT.map((_, mi) => {
                    const paid = c.paidByMonth?.[mi as MonthIndex] === true;
                    return (
                      <td
                        key={mi}
                        className={`px-0.5 py-1 align-top transition-[background-color,box-shadow] duration-300 ${
                          showPaidColumn && paid
                            ? "bg-emerald-50/95 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)] dark:bg-emerald-950/40 dark:shadow-[inset_0_0_0_1px_rgba(52,211,153,0.25)]"
                            : ""
                        }`}
                      >
                        <MonthInput
                          inputKey={`${c.id}-${mi}-${c.byMonth[mi as MonthIndex] ?? 0}`}
                          value={c.byMonth[mi as MonthIndex] ?? 0}
                          onChange={(n) => setCategoryAmount(c.id, mi as MonthIndex, n)}
                        />
                        {showPaidColumn ? (
                          <PaidToggle
                            paid={paid}
                            onToggle={() => toggleCategoryPaid(c.id, mi as MonthIndex)}
                          />
                        ) : null}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-right tabular-nums text-[var(--app-muted)]">
                    {formatCop(total)}
                  </td>
                  <td className="px-1">
                    <button
                      type="button"
                      className="text-rose-600 transition-colors hover:text-rose-800"
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
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-lg bg-[var(--app-border)]" />
        <div className="h-64 rounded-xl bg-[var(--app-border)]" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorías y montos</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
          Montos por mes como en tu Excel. El <strong className="text-emerald-700 dark:text-emerald-400">✓</strong>{" "}
          pequeño solo aparece en <strong>Egresos recurrentes</strong>: marca el gasto fijo pagado (celda verde).
          Lo del día a día va en <strong>Por mes</strong>; lo compartido con tu pareja en{" "}
          <strong>Compartido</strong>.
        </p>
        <label className="mt-4 flex max-w-xs flex-col gap-1 text-sm">
          <span className="text-[var(--app-muted)]">Etiqueta del año</span>
          <input
            className="rounded-lg border border-[var(--app-border)] px-3 py-2 transition-shadow focus:ring-2 focus:ring-[var(--app-accent-soft)]"
            value={data.yearLabel}
            onChange={(e) => setYearLabel(e.target.value)}
          />
        </label>
      </div>

      <Section
        title="Ingresos"
        kind="income"
        hint="Solo montos por mes (sin ✓)."
      />
      <Section
        id="categorias-egresos"
        title="Egresos recurrentes"
        kind="expense"
        showPaidColumn
        hint="Alquiler, servicios, aportes… ✓ pequeño al pagar (verde como en tu Excel)."
      />
      <Section
        id="categorias-deudas"
        title="Deudas"
        kind="debt"
        hint="Cuotas y banco: montos por mes (sin ✓; el seguimiento de pago puedes llevarlo en notas)."
      />
    </div>
  );
}
