"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "finanzas-theme";

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- leer localStorage tras mount */
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark =
      stored === "dark" ||
      (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    /* eslint-enable react-hooks/set-state-in-effect */
    applyDark(prefersDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    applyDark(next);
  }

  if (!mounted) {
    return (
      <span className="inline-flex h-9 w-9 shrink-0 rounded-full border border-[var(--app-border)] bg-[var(--app-card)]" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-card)] text-base shadow-sm transition-colors hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
    >
      <span className="sr-only">{dark ? "Activar modo claro" : "Activar modo oscuro"}</span>
      <span aria-hidden>{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}
