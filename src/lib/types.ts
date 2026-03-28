export type CategoryKind = "income" | "expense" | "debt";

export type MonthIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export interface CategoryLine {
  id: string;
  name: string;
  kind: CategoryKind;
  /** Monto por mes (misma fila que en tu Excel por categoría). */
  byMonth: Record<MonthIndex, number>;
  /** Mes marcado como pagado / listo (celda verde como en tu Excel). */
  paidByMonth?: Partial<Record<MonthIndex, boolean>>;
}

export interface ExtraTransaction {
  id: string;
  monthIndex: MonthIndex;
  name: string;
  amount: number;
  /** ISO date opcional */
  date?: string;
}

export interface ProjectItem {
  id: string;
  label: string;
  amount: number;
}

export interface Project {
  id: string;
  name: string;
  notes?: string;
  items: ProjectItem[];
}

export interface FinanceData {
  version: 1;
  yearLabel: string;
  categories: CategoryLine[];
  extraTransactions: ExtraTransaction[];
  projects: Project[];
}

/** Estado completo: varios años + año activo en la UI. */
export interface FinanceBundle {
  version: 2;
  activeYearKey: string;
  years: Record<string, FinanceData>;
  updatedAt?: string;
}
