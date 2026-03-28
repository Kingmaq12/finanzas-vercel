"use client";

import {
  ensureYearInBundle,
  getActiveYearData,
  normalizeToBundle,
} from "@/lib/bundle";
import { createDefaultBundle } from "@/lib/default-state";
import {
  loadFinanceBundle,
  saveFinanceBundle,
} from "@/lib/storage";
import type {
  CategoryKind,
  CategoryLine,
  ExtraTransaction,
  FinanceBundle,
  FinanceData,
  MonthIndex,
  Project,
} from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type SyncState = "idle" | "loading_remote" | "ready" | "saving" | "saved" | "local_only" | "error";

type FinanceContextValue = {
  ready: boolean;
  syncState: SyncState;
  bundle: FinanceBundle;
  data: FinanceData;
  activeYearKey: string;
  yearKeys: string[];
  setActiveYear: (key: string) => void;
  addYear: (key: string) => void;
  setYearLabel: (y: string) => void;
  replaceAll: (d: FinanceData | FinanceBundle) => void;
  reset: () => void;
  setCategoryAmount: (categoryId: string, month: MonthIndex, value: number) => void;
  toggleCategoryPaid: (categoryId: string, month: MonthIndex) => void;
  addCategory: (name: string, kind: CategoryKind) => void;
  removeCategory: (categoryId: string) => void;
  renameCategory: (categoryId: string, name: string) => void;
  addExtraTransaction: (t: Omit<ExtraTransaction, "id">) => void;
  updateExtraTransaction: (id: string, patch: Partial<ExtraTransaction>) => void;
  removeExtraTransaction: (id: string) => void;
  addProject: (name: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;
  addProjectItem: (projectId: string, label: string, amount: number) => void;
  updateProjectItem: (
    projectId: string,
    itemId: string,
    patch: Partial<{ label: string; amount: number }>,
  ) => void;
  removeProjectItem: (projectId: string, itemId: string) => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [bundle, setBundle] = useState<FinanceBundle>(createDefaultBundle);
  const [remoteSynced, setRemoteSynced] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      setBundle(loadFinanceBundle());
      setReady(true);
    });
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveFinanceBundle(bundle);
  }, [bundle, ready]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setSyncState("loading_remote");
    (async () => {
      try {
        const res = await fetch("/api/finance", { credentials: "include" });
        if (cancelled) return;
        if (res.ok) {
          const j = (await res.json()) as {
            bundle: FinanceBundle | null;
            updatedAt: string | null;
          };
          if (j.bundle && j.bundle.version === 2) {
            setBundle(j.bundle);
          }
          setSyncState("saved");
        } else if (res.status === 503) {
          setSyncState("local_only");
        } else if (res.status === 401) {
          setSyncState("local_only");
        } else {
          setSyncState("error");
        }
      } catch {
        if (!cancelled) setSyncState("local_only");
      } finally {
        if (!cancelled) setRemoteSynced(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !remoteSynced) return;
    const t = setTimeout(() => {
      (async () => {
        try {
          setSyncState((s) => (s === "saving" ? s : "saving"));
          const res = await fetch("/api/finance", {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bundle),
          });
          if (res.ok) setSyncState("saved");
          else if (res.status === 503) setSyncState("local_only");
          else setSyncState("error");
        } catch {
          setSyncState("local_only");
        }
      })();
    }, 1200);
    return () => clearTimeout(t);
  }, [bundle, ready, remoteSynced]);

  const updateActive = useCallback((fn: (d: FinanceData) => FinanceData) => {
    setBundle((b) => {
      const key = b.activeYearKey;
      const cur = b.years[key];
      if (!cur) return b;
      return {
        ...b,
        updatedAt: new Date().toISOString(),
        years: { ...b.years, [key]: fn(cur) },
      };
    });
  }, []);

  const setYearLabel = useCallback(
    (yearLabel: string) => {
      updateActive((d) => ({ ...d, yearLabel }));
    },
    [updateActive],
  );

  const setActiveYear = useCallback((key: string) => {
    setBundle((b) => {
      const next = ensureYearInBundle({ ...b, activeYearKey: key }, key);
      return { ...next, updatedAt: new Date().toISOString() };
    });
  }, []);

  const addYear = useCallback((key: string) => {
    setBundle((b) => ensureYearInBundle(b, key));
  }, []);

  const replaceAll = useCallback((input: FinanceData | FinanceBundle) => {
    setBundle(normalizeToBundle(input));
  }, []);

  const reset = useCallback(() => {
    setBundle(createDefaultBundle());
  }, []);

  const setCategoryAmount = useCallback(
    (categoryId: string, month: MonthIndex, value: number) => {
      updateActive((d) => ({
        ...d,
        categories: d.categories.map((c) =>
          c.id === categoryId
            ? { ...c, byMonth: { ...c.byMonth, [month]: value } }
            : c,
        ),
      }));
    },
    [updateActive],
  );

  const toggleCategoryPaid = useCallback(
    (categoryId: string, month: MonthIndex) => {
      updateActive((d) => ({
        ...d,
        categories: d.categories.map((c) => {
          if (c.id !== categoryId) return c;
          const cur = c.paidByMonth?.[month] ?? false;
          return {
            ...c,
            paidByMonth: { ...c.paidByMonth, [month]: !cur },
          };
        }),
      }));
    },
    [updateActive],
  );

  const addCategory = useCallback(
    (name: string, kind: CategoryKind) => {
      const empty: Record<MonthIndex, number> = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
      };
      const line: CategoryLine = {
        id: newId(),
        name,
        kind,
        byMonth: empty,
        paidByMonth: {},
      };
      updateActive((d) => ({ ...d, categories: [...d.categories, line] }));
    },
    [updateActive],
  );

  const removeCategory = useCallback(
    (categoryId: string) => {
      updateActive((d) => ({
        ...d,
        categories: d.categories.filter((c) => c.id !== categoryId),
      }));
    },
    [updateActive],
  );

  const renameCategory = useCallback(
    (categoryId: string, name: string) => {
      updateActive((d) => ({
        ...d,
        categories: d.categories.map((c) =>
          c.id === categoryId ? { ...c, name } : c,
        ),
      }));
    },
    [updateActive],
  );

  const addExtraTransaction = useCallback(
    (t: Omit<ExtraTransaction, "id">) => {
      updateActive((d) => ({
        ...d,
        extraTransactions: [...d.extraTransactions, { ...t, id: newId() }],
      }));
    },
    [updateActive],
  );

  const updateExtraTransaction = useCallback(
    (id: string, patch: Partial<ExtraTransaction>) => {
      updateActive((d) => ({
        ...d,
        extraTransactions: d.extraTransactions.map((x) =>
          x.id === id ? { ...x, ...patch } : x,
        ),
      }));
    },
    [updateActive],
  );

  const removeExtraTransaction = useCallback(
    (id: string) => {
      updateActive((d) => ({
        ...d,
        extraTransactions: d.extraTransactions.filter((x) => x.id !== id),
      }));
    },
    [updateActive],
  );

  const addProject = useCallback(
    (name: string) => {
      updateActive((d) => ({
        ...d,
        projects: [...d.projects, { id: newId(), name, items: [] }],
      }));
    },
    [updateActive],
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      updateActive((d) => ({
        ...d,
        projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    },
    [updateActive],
  );

  const removeProject = useCallback(
    (id: string) => {
      updateActive((d) => ({
        ...d,
        projects: d.projects.filter((p) => p.id !== id),
      }));
    },
    [updateActive],
  );

  const addProjectItem = useCallback(
    (projectId: string, label: string, amount: number) => {
      updateActive((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                items: [...p.items, { id: newId(), label, amount }],
              }
            : p,
        ),
      }));
    },
    [updateActive],
  );

  const updateProjectItem = useCallback(
    (
      projectId: string,
      itemId: string,
      patch: Partial<{ label: string; amount: number }>,
    ) => {
      updateActive((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                items: p.items.map((it) =>
                  it.id === itemId ? { ...it, ...patch } : it,
                ),
              }
            : p,
        ),
      }));
    },
    [updateActive],
  );

  const removeProjectItem = useCallback(
    (projectId: string, itemId: string) => {
      updateActive((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === projectId
            ? { ...p, items: p.items.filter((it) => it.id !== itemId) }
            : p,
        ),
      }));
    },
    [updateActive],
  );

  const data = useMemo(
    () => getActiveYearData(bundle),
    [bundle],
  );

  const yearKeys = useMemo(
    () => Object.keys(bundle.years).sort((a, b) => Number(a) - Number(b)),
    [bundle.years],
  );

  const value = useMemo(
    () => ({
      ready,
      syncState,
      bundle,
      data,
      activeYearKey: bundle.activeYearKey,
      yearKeys,
      setActiveYear,
      addYear,
      setYearLabel,
      replaceAll,
      reset,
      setCategoryAmount,
      toggleCategoryPaid,
      addCategory,
      removeCategory,
      renameCategory,
      addExtraTransaction,
      updateExtraTransaction,
      removeExtraTransaction,
      addProject,
      updateProject,
      removeProject,
      addProjectItem,
      updateProjectItem,
      removeProjectItem,
    }),
    [
      ready,
      syncState,
      bundle,
      data,
      yearKeys,
      setActiveYear,
      addYear,
      setYearLabel,
      replaceAll,
      reset,
      setCategoryAmount,
      toggleCategoryPaid,
      addCategory,
      removeCategory,
      renameCategory,
      addExtraTransaction,
      updateExtraTransaction,
      removeExtraTransaction,
      addProject,
      updateProject,
      removeProject,
      addProjectItem,
      updateProjectItem,
      removeProjectItem,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance dentro de FinanceProvider");
  return ctx;
}
