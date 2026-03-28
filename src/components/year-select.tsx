"use client";

import { useFinance } from "@/context/finance-context";
import { PLAN_YEAR_END, PLAN_YEAR_START } from "@/lib/default-state";
import { useState } from "react";

export function YearSelect() {
  const { ready, yearKeys, activeYearKey, setActiveYear, addYear } = useFinance();
  const [custom, setCustom] = useState("");

  if (!ready) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="year-select">
        Año
      </label>
      <select
        id="year-select"
        className="min-h-11 min-w-[5.5rem] rounded-xl border border-[var(--app-border)] bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[var(--app-accent)]"
        value={activeYearKey}
        onChange={(e) => setActiveYear(e.target.value)}
      >
        {yearKeys.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <span className="hidden text-xs text-[var(--app-muted)] sm:inline">
        Plan {PLAN_YEAR_START}–{PLAN_YEAR_END}
      </span>
      <div className="flex items-center gap-1">
        <input
          className="h-11 w-20 rounded-lg border border-[var(--app-border)] px-2 py-2 text-sm"
          placeholder="Año"
          inputMode="numeric"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button
          type="button"
          className="tap-target rounded-lg border border-[var(--app-border)] bg-white px-3 py-2 text-xs font-medium"
          onClick={() => {
            const n = custom.trim();
            if (!/^\d{4}$/.test(n)) return;
            addYear(n);
            setActiveYear(n);
            setCustom("");
          }}
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
