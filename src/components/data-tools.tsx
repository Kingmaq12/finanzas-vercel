"use client";

import { useFinance } from "@/context/finance-context";
import { exportBundleJson, importBundleJson } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function DataTools() {
  const router = useRouter();
  const { ready, bundle, replaceAll, reset } = useFinance();
  const [err, setErr] = useState<string | null>(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<{
    authEnabled: boolean;
    authenticated: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) =>
        setSession({
          authEnabled: Boolean(j.authEnabled),
          authenticated: Boolean(j.authenticated),
        }),
      )
      .catch(() => setSession({ authEnabled: false, authenticated: false }));
  }, []);

  async function downloadExcel() {
    setErr(null);
    setExcelLoading(true);
    try {
      const res = await fetch("/api/excel/export", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "No se pudo generar el Excel");
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `finanzas-${Object.keys(bundle.years).sort().join("-")}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al exportar Excel");
    } finally {
      setExcelLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  }

  if (!ready) {
    return <p className="text-sm text-[var(--app-muted)]">Cargando…</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tus datos</h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          Copia local en el navegador más sincronización opcional con PostgreSQL (Neon) en
          Vercel. En móvil, los mismos datos si iniciaste sesión y la base está configurada.
        </p>
      </div>

      {err && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {err}
        </p>
      )}

      <div className="space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--app-muted)]">
          Excel (2026–2030 y años extra)
        </h2>
        <p className="text-sm text-[var(--app-muted)]">
          Descarga un .xlsx con una hoja por año: resumen, categorías y gastos adicionales.
          La app no edita el archivo en el servidor; la fuente de verdad es la base JSON /
          Postgres.
        </p>
        <button
          type="button"
          disabled={excelLoading}
          className="tap-target rounded-lg bg-[var(--app-accent)] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          onClick={() => void downloadExcel()}
        >
          {excelLoading ? "Generando…" : "Descargar Excel"}
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--app-muted)]">
          Exportar JSON
        </h2>
        <p className="text-sm text-[var(--app-muted)]">
          Respaldo completo (todos los años en un solo archivo).
        </p>
        <button
          type="button"
          className="tap-target rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white"
          onClick={() => {
            setErr(null);
            const blob = new Blob([exportBundleJson(bundle)], {
              type: "application/json",
            });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `finanzas-bundle-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          Descargar JSON
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--app-muted)]">
          Importar JSON
        </h2>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            setErr(null);
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const text = await f.text();
              const next = importBundleJson(text);
              replaceAll(next);
            } catch {
              setErr("Archivo JSON inválido.");
            }
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="tap-target rounded-lg border border-[var(--app-border)] bg-white px-4 py-3 text-sm font-medium"
          onClick={() => fileRef.current?.click()}
        >
          Elegir archivo…
        </button>
      </div>

      {session?.authEnabled && session.authenticated && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-sm font-semibold text-slate-800">Sesión</h2>
          <p className="text-sm text-slate-600">
            Cierra sesión en este dispositivo (obligatorio si usas contraseña en el
            servidor).
          </p>
          <button
            type="button"
            className="tap-target rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800"
            onClick={() => void logout()}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-6">
        <h2 className="text-sm font-semibold text-rose-900">Zona peligrosa</h2>
        <p className="text-sm text-rose-900/80">
          Vuelve a la plantilla inicial (años 2026–2030 vacíos).
        </p>
        <button
          type="button"
          className="tap-target rounded-lg border border-rose-300 bg-white px-4 py-3 text-sm font-medium text-rose-800"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.confirm(
                "¿Seguro? Se borrarán todos los datos en este navegador (y en la nube al sincronizar).",
              )
            ) {
              setErr(null);
              reset();
            }
          }}
        >
          Restablecer datos
        </button>
      </div>
    </div>
  );
}
