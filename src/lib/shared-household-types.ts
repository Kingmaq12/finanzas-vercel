/** Estado compartido entre miembros del hogar (misma fila en Neon). */
export type SharedExpenseLine = {
  id: string;
  name: string;
  notes?: string;
  /** Monto por mes (0–11), opcional. */
  byMonth?: Partial<Record<number, number>>;
};

export type SharedProjectItem = { id: string; label: string; amount: number };

export type SharedProject = {
  id: string;
  name: string;
  notes?: string;
  items: SharedProjectItem[];
};

export interface SharedHouseholdPayload {
  version: 1;
  expenseLines: SharedExpenseLine[];
  sharedProjects: SharedProject[];
  /** Emails sugeridos al crear eventos (se pueden sobrescribir por evento). */
  defaultNotifyEmails?: string[];
}

export function createDefaultSharedPayload(): SharedHouseholdPayload {
  return {
    version: 1,
    expenseLines: [],
    sharedProjects: [],
    defaultNotifyEmails: [],
  };
}

export function isSharedHouseholdPayload(x: unknown): x is SharedHouseholdPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as SharedHouseholdPayload;
  return (
    o.version === 1 &&
    Array.isArray(o.expenseLines) &&
    Array.isArray(o.sharedProjects)
  );
}
