"use client";

import type { SyncState } from "@/context/finance-context";

const labels: Record<SyncState, string> = {
  idle: "Listo",
  loading_remote: "Sincronizando…",
  ready: "Listo",
  saving: "Guardando…",
  saved: "En la nube",
  local_only: "Solo aquí",
  error: "Error al guardar",
};

export function SyncBadge({ state }: { state: SyncState }) {
  const tone =
    state === "saved"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : state === "local_only" || state === "loading_remote"
        ? "text-amber-800 bg-amber-50 border-amber-200"
        : state === "error"
          ? "text-rose-800 bg-rose-50 border-rose-200"
          : "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <span
      className={`inline-flex max-w-[min(100%,14rem)] items-center truncate rounded-full border px-2.5 py-1 text-[10px] font-medium leading-none sm:max-w-none sm:text-xs ${tone}`}
      title={labels[state]}
    >
      {labels[state]}
    </span>
  );
}
