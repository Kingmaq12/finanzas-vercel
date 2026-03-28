"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFinance } from "@/context/finance-context";
import { MonthReminderBanner } from "./month-reminder-banner";
import { SyncBadge } from "./sync-badge";
import { YearSelect } from "./year-select";

const links = [
  { href: "/", label: "Resumen", short: "Inicio" },
  { href: "/categorias", label: "Categorías", short: "Cats" },
  { href: "/mes/enero", label: "Por mes", short: "Mes" },
  { href: "/proyectos", label: "Proyectos", short: "Metas" },
  { href: "/datos", label: "Datos", short: "Datos" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { syncState } = useFinance();

  return (
    <div className="min-h-[100dvh] bg-[var(--app-bg)] text-[var(--app-fg)]">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1600px] flex-col md:flex-row">
        <aside className="sticky top-0 z-20 hidden h-screen w-56 shrink-0 flex-col border-r border-[var(--app-border)] bg-[var(--app-sidebar)] px-4 py-8 md:flex">
          <div className="mb-6 px-2">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--app-muted)]">
              Finanzas
            </p>
            <p className="mt-1 font-semibold tracking-tight">Panel multi-año</p>
          </div>
          <div className="mb-6 px-2">
            <YearSelect />
          </div>
          <div className="mb-4 px-2">
            <SyncBadge state={syncState} />
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {links.map((l) => {
              const active =
                l.href === "/"
                  ? pathname === "/"
                  : pathname === l.href || pathname.startsWith(`${l.href}/`);
              if (l.href === "/mes/enero") {
                const mesActive = pathname.startsWith("/mes/");
                return (
                  <Link
                    key={l.href}
                    href="/mes/enero"
                    className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      mesActive
                        ? "bg-[var(--app-accent-soft)] font-medium text-[var(--app-accent)]"
                        : "text-[var(--app-muted)] hover:bg-black/[0.04] hover:text-[var(--app-fg)]"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-[var(--app-accent-soft)] font-medium text-[var(--app-accent)]"
                      : "text-[var(--app-muted)] hover:bg-black/[0.04] hover:text-[var(--app-fg)]"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] bg-[var(--app-header)]/95 px-4 py-3 backdrop-blur-md md:hidden">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
                Finanzas
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <YearSelect />
                <SyncBadge state={syncState} />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-12">
            <MonthReminderBanner />
            {children}
          </main>

          <nav
            className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[var(--app-border)] bg-[var(--app-card)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
            aria-label="Principal"
          >
            {links.map((l) => {
              const mes = l.href === "/mes/enero";
              const active = mes
                ? pathname.startsWith("/mes/")
                : l.href === "/"
                  ? pathname === "/"
                  : pathname === l.href;
              const href = mes ? "/mes/enero" : l.href;
              return (
                <Link
                  key={l.href}
                  href={href}
                  className={`tap-target flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium leading-tight ${
                    active ? "text-[var(--app-accent)]" : "text-[var(--app-muted)]"
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {l.short === "Inicio"
                      ? "⌂"
                      : l.short === "Cats"
                        ? "▤"
                        : l.short === "Mes"
                          ? "▦"
                          : l.short === "Metas"
                            ? "◇"
                            : "⎘"}
                  </span>
                  <span>{l.short}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
