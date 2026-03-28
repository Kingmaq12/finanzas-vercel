import {
  isFinanceBundle,
  isFinanceData,
  normalizeToBundle,
} from "./bundle";
import { createDefaultBundle, createDefaultFinanceData } from "./default-state";
import type { FinanceBundle, FinanceData } from "./types";

const KEY_V2 = "finanzas-vercel:v2";
const KEY_V1 = "finanzas-vercel:v1";

export function loadFinanceBundle(): FinanceBundle {
  if (typeof window === "undefined") return createDefaultBundle();
  try {
    const rawV2 = localStorage.getItem(KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as unknown;
      if (isFinanceBundle(parsed)) {
        return parsed;
      }
    }
    const rawV1 = localStorage.getItem(KEY_V1);
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as unknown;
      if (isFinanceData(parsed)) {
        const b = normalizeToBundle(parsed);
        saveFinanceBundle(b);
        localStorage.removeItem(KEY_V1);
        return b;
      }
    }
  } catch {
    /* fallthrough */
  }
  return createDefaultBundle();
}

export function saveFinanceBundle(bundle: FinanceBundle): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    KEY_V2,
    JSON.stringify({ ...bundle, updatedAt: new Date().toISOString() }),
  );
}

export function exportBundleJson(bundle: FinanceBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function importBundleJson(text: string): FinanceBundle {
  const parsed = JSON.parse(text) as unknown;
  if (isFinanceBundle(parsed)) {
    return { ...parsed, updatedAt: new Date().toISOString() };
  }
  if (isFinanceData(parsed)) {
    return normalizeToBundle(parsed);
  }
  throw new Error("JSON inválido");
}

/** Compat: export solo año activo como antes */
export function exportJson(data: FinanceData): string {
  return JSON.stringify(data, null, 2);
}

export function importJson(text: string): FinanceData {
  const parsed = JSON.parse(text) as unknown;
  if (isFinanceData(parsed)) return parsed;
  if (isFinanceBundle(parsed)) {
    return parsed.years[parsed.activeYearKey] ?? createDefaultFinanceData();
  }
  throw new Error("JSON inválido");
}
