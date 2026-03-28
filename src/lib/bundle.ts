import { createDefaultFinanceData } from "./default-state";
import type { FinanceBundle, FinanceData } from "./types";

export function isFinanceBundle(x: unknown): x is FinanceBundle {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as FinanceBundle).version === 2 &&
    typeof (x as FinanceBundle).activeYearKey === "string" &&
    typeof (x as FinanceBundle).years === "object" &&
    (x as FinanceBundle).years !== null
  );
}

export function isFinanceData(x: unknown): x is FinanceData {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as FinanceData).version === 1 &&
    Array.isArray((x as FinanceData).categories)
  );
}

export function normalizeToBundle(input: FinanceData | FinanceBundle): FinanceBundle {
  if (isFinanceBundle(input)) {
    return { ...input, updatedAt: input.updatedAt ?? new Date().toISOString() };
  }
  const key = input.yearLabel || "2026";
  return {
    version: 2,
    activeYearKey: key,
    years: { [key]: input },
    updatedAt: new Date().toISOString(),
  };
}

export function ensureYearInBundle(
  bundle: FinanceBundle,
  yearKey: string,
): FinanceBundle {
  if (bundle.years[yearKey]) return bundle;
  const d = createDefaultFinanceData();
  d.yearLabel = yearKey;
  return {
    ...bundle,
    years: { ...bundle.years, [yearKey]: d },
    updatedAt: new Date().toISOString(),
  };
}

export function getActiveYearData(bundle: FinanceBundle): FinanceData {
  const y = bundle.years[bundle.activeYearKey];
  if (y) return y;
  const first = Object.keys(bundle.years).sort()[0];
  return bundle.years[first] ?? createDefaultFinanceData();
}
