"use client";

import { parseAmountInput } from "@/lib/format";
import { MONTH_SHORT } from "@/lib/months";
import type { SharedExpenseLine, SharedHouseholdPayload } from "@/lib/shared-household-types";
import type { MonthIndex } from "@/lib/types";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type CalEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  notes: string | null;
  notifyEnabled: boolean;
  notifyEmails: string[];
  notifyMinutesBefore: number;
  lastNotifiedAt: string | null;
};

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SharedHouseholdView() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [noHousehold, setNoHousehold] = useState(false);
  const [payload, setPayload] = useState<SharedHouseholdPayload | null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAll = useCallback(async () => {
    setErr(null);
    const st = await fetch("/api/household/state", { credentials: "include" });
    if (st.status === 404) {
      const j = (await st.json()) as { code?: string };
      if (j.code === "NO_HOUSEHOLD") setNoHousehold(true);
      else setErr("No se pudo cargar el hogar compartido.");
      setLoading(false);
      return;
    }
    if (!st.ok) {
      setErr("Error al cargar datos compartidos.");
      setLoading(false);
      return;
    }
    const sj = (await st.json()) as { payload: SharedHouseholdPayload };
    setPayload(sj.payload);
    setNoHousehold(false);

    const ev = await fetch("/api/household/events", { credentials: "include" });
    if (ev.ok) {
      const ej = (await ev.json()) as { events: CalEvent[] };
      setEvents(ej.events ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const scheduleSave = useCallback((next: SharedHouseholdPayload) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const res = await fetch("/api/household/state", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) setErr("No se pudo guardar (revisa conexión).");
    }, 600);
  }, []);

  const updatePayload = useCallback(
    (fn: (p: SharedHouseholdPayload) => SharedHouseholdPayload) => {
      setPayload((prev) => {
        if (!prev) return prev;
        const next = fn({ ...prev, version: 1 });
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const [tab, setTab] = useState<"gastos" | "proyectos" | "calendario">("gastos");

  const [evTitle, setEvTitle] = useState("");
  const [evStart, setEvStart] = useState("");
  const [evNotes, setEvNotes] = useState("");
  const [evNotify, setEvNotify] = useState(false);
  const [evMinutes, setEvMinutes] = useState("1440");
  const [notifyRunLoading, setNotifyRunLoading] = useState(false);
  const [notifyRunMsg, setNotifyRunMsg] = useState<string | null>(null);

  async function runCalendarNotifyNow() {
    setNotifyRunMsg(null);
    setNotifyRunLoading(true);
    try {
      const res = await fetch("/api/household/calendar-notify-now", {
        method: "POST",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        sent?: number;
        pending?: number;
        waitingForWindow?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok) {
        setNotifyRunMsg(j.error ?? "No se pudo ejecutar.");
        return;
      }
      const sent = j.sent ?? 0;
      const pending = j.pending ?? 0;
      const wait = j.waitingForWindow ?? 0;
      if ((j.errors?.length ?? 0) > 0) {
        setNotifyRunMsg(
          `${sent > 0 ? `Se enviaron ${sent}, pero hubo fallos: ` : ""}${j.errors!.join(" ")}`,
        );
        void loadAll();
        return;
      }
      if (sent > 0) {
        setNotifyRunMsg(`Listo: se enviaron ${sent} aviso(s) a Telegram.`);
      } else if (pending === 0) {
        setNotifyRunMsg("No hay eventos futuros con aviso pendiente.");
      } else if (wait > 0) {
        setNotifyRunMsg(
          `Aún no toca: ${wait} evento(s) están antes de la ventana (“X minutos antes”). Espera o vuelve a pulsar cuando llegue esa hora.`,
        );
      } else {
        setNotifyRunMsg(
          "Ningún aviso enviado. Si el evento ya pasó sin disparar el aviso, no se puede recuperar; crea uno nuevo o más adelante en el tiempo.",
        );
      }
      void loadAll();
    } finally {
      setNotifyRunLoading(false);
    }
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!evTitle.trim() || !evStart) return;
    const res = await fetch("/api/household/events", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: evTitle.trim(),
        startsAt: new Date(evStart).toISOString(),
        notes: evNotes.trim() || undefined,
        notifyEnabled: evNotify,
        notifyEmails: [],
        notifyMinutesBefore: (() => {
          const n = Number(evMinutes);
          return Number.isFinite(n) && n >= 0 ? n : 1440;
        })(),
      }),
    });
    if (res.ok) {
      setEvTitle("");
      setEvStart("");
      setEvNotes("");
      setEvNotify(false);
      loadAll();
    } else setErr("No se pudo crear el evento.");
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/household/events?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    loadAll();
  }

  if (loading) {
    return <p className="text-sm text-[var(--app-muted)]">Cargando hogar compartido…</p>;
  }

  if (noHousehold) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">Aún no tienes un hogar compartido en la base de datos.</p>
        <p className="mt-2 text-amber-900/90 dark:text-amber-200/90">
          En tu máquina (con <code className="rounded bg-black/10 px-1">DATABASE_URL</code> en{" "}
          <code className="rounded bg-black/10 px-1">.env.local</code>) ejecuta:{" "}
          <code className="mt-2 block rounded-lg bg-black/10 p-2 font-mono text-xs">
            npm run db:ensure-household
          </code>
        </p>
      </div>
    );
  }

  if (!payload) {
    return <p className="text-sm text-rose-600">{err ?? "Error"}</p>;
  }

  const tabs = [
    { id: "gastos" as const, label: "Gastos compartidos" },
    { id: "proyectos" as const, label: "Metas compartidas" },
    { id: "calendario" as const, label: "Calendario" },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Hogar compartido</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
          Lo que ves aquí lo comparten todos los miembros del hogar (Casa, mascota, etc.). Tus{" "}
          <strong>Proyectos</strong> personales siguen en su sección.
        </p>
      </motion.div>

      {err && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {err}
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-b border-[var(--app-border)] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[var(--app-accent)] text-white shadow-sm"
                : "text-[var(--app-muted)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "gastos" && (
        <SharedExpensesTab payload={payload} updatePayload={updatePayload} />
      )}
      {tab === "proyectos" && (
        <SharedProjectsTab payload={payload} updatePayload={updatePayload} />
      )}
      {tab === "calendario" && (
        <div className="space-y-8">
          <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-sm">
            <h2 className="text-sm font-semibold">Recordatorios (Telegram)</h2>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              En <strong>Vercel Hobby</strong> el cron oficial solo corre <strong>una vez al día</strong>, así
              que un aviso de “1 minuto antes” <strong>no se dispara solo</strong> salvo que coincidas con esa
              hora. Opciones: subir a Pro, un <strong>ping externo</strong> cada pocos minutos al mismo
              endpoint que el cron, o usar el botón de abajo cuando estés en la ventana de aviso.
            </p>
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              Servidor: <code className="text-[10px]">TELEGRAM_BOT_TOKEN</code>,{" "}
              <code className="text-[10px]">TELEGRAM_CHAT_ID</code>. Prueba genérica del bot en{" "}
              <strong>Datos</strong>.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={notifyRunLoading}
                className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={() => void runCalendarNotifyNow()}
              >
                {notifyRunLoading ? "Comprobando…" : "Enviar avisos que toquen ahora"}
              </button>
            </div>
            {notifyRunMsg && (
              <p className="mt-3 text-xs text-[var(--app-muted)]" role="status">
                {notifyRunMsg}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6 shadow-sm">
            <h2 className="text-sm font-semibold">Nuevo evento</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={addEvent}>
              <input
                required
                className="rounded-lg border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 py-2 text-sm"
                placeholder="Título"
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
              />
              <input
                required
                type="datetime-local"
                className="rounded-lg border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 py-2 text-sm"
                value={evStart}
                onChange={(e) => setEvStart(e.target.value)}
              />
              <input
                className="sm:col-span-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 py-2 text-sm"
                placeholder="Notas"
                value={evNotes}
                onChange={(e) => setEvNotes(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={evNotify}
                  onChange={(e) => setEvNotify(e.target.checked)}
                />
                Notificar por Telegram
              </label>
              <input
                className="rounded-lg border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 py-2 text-sm"
                placeholder="Minutos antes (ej. 1440 = 24h)"
                value={evMinutes}
                onChange={(e) => setEvMinutes(e.target.value)}
              />
              <button
                type="submit"
                className="sm:col-span-2 rounded-lg bg-[var(--app-accent)] py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
              >
                Guardar evento
              </button>
            </form>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--app-muted)]">Próximos eventos</h2>
            <ul className="space-y-2">
              {events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-col gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-xs text-[var(--app-muted)]">
                      {new Date(ev.startsAt).toLocaleString("es-CO", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </p>
                    {ev.notifyEnabled && (
                      <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                        Telegram · {ev.notifyMinutesBefore} min antes
                        {ev.lastNotifiedAt ? " · aviso enviado" : ""}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteEvent(ev.id)}
                    className="self-start text-sm text-rose-600 hover:text-rose-800"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
            {events.length === 0 && (
              <p className="text-sm text-[var(--app-muted)]">No hay eventos todavía.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SharedExpensesTab({
  payload,
  updatePayload,
}: {
  payload: SharedHouseholdPayload;
  updatePayload: (fn: (p: SharedHouseholdPayload) => SharedHouseholdPayload) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white"
          onClick={() =>
            updatePayload((p) => ({
              ...p,
              expenseLines: [
                ...p.expenseLines,
                { id: newId(), name: "Nueva línea", byMonth: {} },
              ],
            }))
          }
        >
          Añadir línea
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--app-border)] bg-black/[0.02]">
              <th className="sticky left-0 z-10 bg-[var(--app-card)] px-2 py-2 text-left">Concepto</th>
              {MONTH_SHORT.map((m) => (
                <th key={m} className="px-0.5 py-2 text-center text-[var(--app-muted)]">
                  {m}
                </th>
              ))}
              <th className="w-8 px-1" />
            </tr>
          </thead>
          <tbody>
            {payload.expenseLines.map((line) => (
              <ExpenseLineRow key={line.id} line={line} updatePayload={updatePayload} />
            ))}
          </tbody>
        </table>
        {payload.expenseLines.length === 0 && (
          <p className="p-6 text-center text-sm text-[var(--app-muted)]">
            Añade Casa, Blue, etc.
          </p>
        )}
      </div>
    </div>
  );
}

function ExpenseLineRow({
  line,
  updatePayload,
}: {
  line: SharedExpenseLine;
  updatePayload: (fn: (p: SharedHouseholdPayload) => SharedHouseholdPayload) => void;
}) {
  return (
    <tr className="border-b border-[var(--app-border)]">
      <td className="sticky left-0 z-10 bg-[var(--app-card)] px-2 py-1">
        <input
          className="w-full min-w-[7rem] rounded border border-[var(--app-border)] bg-[var(--app-input-bg)] px-1 py-0.5 text-sm"
          value={line.name}
          onChange={(e) =>
            updatePayload((p) => ({
              ...p,
              expenseLines: p.expenseLines.map((x) =>
                x.id === line.id ? { ...x, name: e.target.value } : x,
              ),
            }))
          }
        />
      </td>
      {MONTH_SHORT.map((_, mi) => (
        <td key={mi} className="px-0.5 py-1">
          <input
            className="w-full min-w-[2.5rem] rounded border border-[var(--app-border)] bg-[var(--app-input-bg)] px-0.5 py-0.5 text-right tabular-nums"
            inputMode="numeric"
            defaultValue={
              line.byMonth?.[mi as MonthIndex] ? String(Math.round(line.byMonth[mi as MonthIndex]!)) : ""
            }
            key={`${line.id}-${mi}-${line.byMonth?.[mi as MonthIndex] ?? 0}`}
            onBlur={(e) => {
              const n = parseAmountInput(e.target.value);
              updatePayload((p) => ({
                ...p,
                expenseLines: p.expenseLines.map((x) =>
                  x.id === line.id
                    ? {
                        ...x,
                        byMonth: { ...x.byMonth, [mi]: n },
                      }
                    : x,
                ),
              }));
            }}
          />
        </td>
      ))}
      <td className="px-1">
        <button
          type="button"
          className="text-rose-600"
          onClick={() =>
            updatePayload((p) => ({
              ...p,
              expenseLines: p.expenseLines.filter((x) => x.id !== line.id),
            }))
          }
        >
          ×
        </button>
      </td>
    </tr>
  );
}

function SharedProjectsTab({
  payload,
  updatePayload,
}: {
  payload: SharedHouseholdPayload;
  updatePayload: (fn: (p: SharedHouseholdPayload) => SharedHouseholdPayload) => void;
}) {
  return (
    <div className="space-y-8">
      <button
        type="button"
        className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-medium text-white"
        onClick={() =>
          updatePayload((p) => ({
            ...p,
            sharedProjects: [
              ...p.sharedProjects,
              { id: newId(), name: "Nuevo grupo", items: [] },
            ],
          }))
        }
      >
        Añadir meta compartida
      </button>
      {payload.sharedProjects.map((proj) => (
        <div
          key={proj.id}
          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-end gap-2">
            <input
              className="min-w-[12rem] flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 py-2 text-sm font-medium"
              value={proj.name}
              onChange={(e) =>
                updatePayload((p) => ({
                  ...p,
                  sharedProjects: p.sharedProjects.map((x) =>
                    x.id === proj.id ? { ...x, name: e.target.value } : x,
                  ),
                }))
              }
            />
            <button
              type="button"
              className="text-sm text-rose-600"
              onClick={() =>
                updatePayload((p) => ({
                  ...p,
                  sharedProjects: p.sharedProjects.filter((x) => x.id !== proj.id),
                }))
              }
            >
              Quitar grupo
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {proj.items.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-2">
                <input
                  className="min-w-[8rem] flex-1 rounded border border-[var(--app-border)] bg-[var(--app-input-bg)] px-2 py-1 text-sm"
                  value={it.label}
                  onChange={(e) =>
                    updatePayload((p) => ({
                      ...p,
                      sharedProjects: p.sharedProjects.map((x) =>
                        x.id === proj.id
                          ? {
                              ...x,
                              items: x.items.map((y) =>
                                y.id === it.id ? { ...y, label: e.target.value } : y,
                              ),
                            }
                          : x,
                      ),
                    }))
                  }
                />
                <input
                  className="w-28 rounded border border-[var(--app-border)] bg-[var(--app-input-bg)] px-2 py-1 text-right text-sm tabular-nums"
                  inputMode="numeric"
                  defaultValue={String(Math.round(it.amount))}
                  key={it.amount}
                  onBlur={(e) => {
                    const n = parseAmountInput(e.target.value);
                    updatePayload((p) => ({
                      ...p,
                      sharedProjects: p.sharedProjects.map((x) =>
                        x.id === proj.id
                          ? {
                              ...x,
                              items: x.items.map((y) =>
                                y.id === it.id ? { ...y, amount: n } : y,
                              ),
                            }
                          : x,
                      ),
                    }));
                  }}
                />
                <button
                  type="button"
                  className="text-rose-600"
                  onClick={() =>
                    updatePayload((p) => ({
                      ...p,
                      sharedProjects: p.sharedProjects.map((x) =>
                        x.id === proj.id
                          ? { ...x, items: x.items.filter((y) => y.id !== it.id) }
                          : x,
                      ),
                    }))
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-[var(--app-accent)]"
            onClick={() =>
              updatePayload((p) => ({
                ...p,
                sharedProjects: p.sharedProjects.map((x) =>
                  x.id === proj.id
                    ? {
                        ...x,
                        items: [...x.items, { id: newId(), label: "Concepto", amount: 0 }],
                      }
                    : x,
                ),
              }))
            }
          >
            + Ítem
          </button>
        </div>
      ))}
      {payload.sharedProjects.length === 0 && (
        <p className="text-sm text-[var(--app-muted)]">Sin metas compartidas aún.</p>
      )}
    </div>
  );
}
