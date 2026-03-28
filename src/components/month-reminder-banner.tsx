"use client";

import { useFinance } from "@/context/finance-context";
import {
  MONTH_REMINDER_DISMISS_KEY,
  calendarYearMonthKey,
  currentCalendarMonthIndex,
  fixedOutflowPaidSummary,
} from "@/lib/fixed-expense-paid";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

function readDismissed(ymd: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MONTH_REMINDER_DISMISS_KEY) === ymd;
  } catch {
    return false;
  }
}

export function MonthReminderBanner() {
  const { ready, data, activeYearKey } = useFinance();
  /** Fuerza recomputar lectura de localStorage tras dismiss. */
  const [dismissVersion, setDismissVersion] = useState(0);

  const ymd = calendarYearMonthKey();
  const dismissedThisMonth = useMemo(() => {
    void dismissVersion;
    return readDismissed(ymd);
  }, [ymd, dismissVersion]);

  const yearMatches =
    ready && activeYearKey === String(new Date().getFullYear());
  const monthIdx = currentCalendarMonthIndex();
  const summary = fixedOutflowPaidSummary(data, monthIdx);

  const show =
    ready &&
    yearMatches &&
    summary.total > 0 &&
    !summary.allPaid &&
    !dismissedThisMonth;

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(MONTH_REMINDER_DISMISS_KEY, ymd);
    } catch {
      /* ignore */
    }
    setDismissVersion((v) => v + 1);
  }, [ymd]);

  if (!show) return null;

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring" as const, stiffness: 420, damping: 32 }}
      className="mb-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/95 to-white px-4 py-3 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-[var(--app-card)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Nuevo mes: revisa los gastos fijos
          </p>
          <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-200/90">
            Marca el <strong className="font-semibold">✓</strong> en{" "}
            <strong>Egresos recurrentes</strong> (
            {summary.paid}/{summary.total} este mes).
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/categorias#categorias-egresos"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-center text-xs font-medium text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-emerald-700"
          >
            Ir a Categorías
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg border border-emerald-300/80 bg-white px-3 py-2 text-xs font-medium text-emerald-900 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:bg-transparent dark:hover:bg-emerald-950/50"
          >
            Entendido
          </button>
        </div>
      </div>
    </motion.div>
  );
}
