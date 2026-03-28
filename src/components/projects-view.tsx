"use client";

import { useFinance } from "@/context/finance-context";
import { formatCop, parseAmountInput } from "@/lib/format";
import { useState } from "react";

export function ProjectsView() {
  const {
    ready,
    data,
    addProject,
    updateProject,
    removeProject,
    addProjectItem,
    updateProjectItem,
    removeProjectItem,
  } = useFinance();
  const [title, setTitle] = useState("");

  if (!ready) {
    return <p className="text-sm text-[var(--app-muted)]">Cargando…</p>;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos personales</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
          Solo tú los ves (van con tu usuario). Para Casa, mascota u objetivos del hogar usa{" "}
          <strong>Compartido</strong>. Aquí: viajes y metas privadas con partidas y totales.
        </p>
        <div className="mt-4 flex max-w-md gap-2">
          <input
            className="flex-1 rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm"
            placeholder="Nuevo proyecto (ej. Viaje Japón)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              const n = title.trim();
              if (!n) return;
              addProject(n);
              setTitle("");
            }}
          >
            Crear
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {data.projects.map((p) => {
          const total = p.items.reduce((s, i) => s + i.amount, 0);
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 space-y-2">
                  <input
                    className="w-full border-b border-transparent text-lg font-semibold outline-none focus:border-[var(--app-border)]"
                    value={p.name}
                    onChange={(e) => updateProject(p.id, { name: e.target.value })}
                  />
                  <textarea
                    className="w-full resize-none rounded-lg border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
                    placeholder="Notas (opcional)"
                    rows={2}
                    value={p.notes ?? ""}
                    onChange={(e) => updateProject(p.id, { notes: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="text-sm text-rose-600 hover:underline"
                  onClick={() => removeProject(p.id)}
                >
                  Eliminar proyecto
                </button>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--app-border)] text-left text-xs uppercase text-[var(--app-muted)]">
                      <th className="py-2">Partida</th>
                      <th className="py-2 text-right">Monto</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {p.items.map((it) => (
                      <tr key={it.id} className="border-b border-[var(--app-border)]">
                        <td className="py-2 pr-2">
                          <input
                            className="w-full rounded border border-transparent px-1 outline-none focus:border-[var(--app-border)]"
                            value={it.label}
                            onChange={(e) =>
                              updateProjectItem(p.id, it.id, { label: e.target.value })
                            }
                          />
                        </td>
                        <td className="py-2 text-right">
                          <input
                            className="w-full rounded border border-[var(--app-border)] px-2 py-1 text-right tabular-nums"
                            inputMode="numeric"
                            defaultValue={String(Math.round(it.amount))}
                            key={it.amount}
                            onBlur={(e) =>
                              updateProjectItem(p.id, it.id, {
                                amount: parseAmountInput(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            className="text-rose-600"
                            onClick={() => removeProjectItem(p.id, it.id)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--app-accent)] hover:underline"
                  onClick={() => addProjectItem(p.id, "Nueva partida", 0)}
                >
                  + Añadir partida
                </button>
                <p className="text-sm">
                  Total estimado:{" "}
                  <span className="font-semibold tabular-nums">{formatCop(total)}</span>
                </p>
              </div>
            </div>
          );
        })}

        {data.projects.length === 0 && (
          <p className="text-center text-sm text-[var(--app-muted)]">
            Aún no hay proyectos. Crea uno para listar gastos previstos como en la hoja Otros.
          </p>
        )}
      </div>
    </div>
  );
}
