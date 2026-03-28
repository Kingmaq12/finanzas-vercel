"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/session");
      const j = (await res.json()) as { authEnabled?: boolean };
      if (cancelled) return;
      if (!j.authEnabled) {
        setSkipped(true);
        router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "Error al iniciar sesión");
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (skipped) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <p className="text-sm text-[var(--app-muted)]">Redirigiendo…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--app-bg)] px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] p-8 shadow-sm">
        <h1 className="text-center text-xl font-semibold tracking-tight">
          Acceso
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--app-muted)]">
          Cada usuario tiene sus datos en la base de datos. Usuario y contraseña
          los define quien administra el proyecto (scripts o panel SQL).
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            name="username"
            autoComplete="username"
            className="w-full rounded-xl border border-[var(--app-border)] px-4 py-3 text-base outline-none focus:border-[var(--app-accent)]"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-[var(--app-border)] px-4 py-3 text-base outline-none focus:border-[var(--app-accent)]"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && (
            <p className="text-sm text-rose-600" role="alert">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="tap-target flex w-full items-center justify-center rounded-xl bg-[var(--app-accent)] py-3.5 text-base font-medium text-white disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
