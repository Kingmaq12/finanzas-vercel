import type { MonthIndex } from "./types";

export const MONTH_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

export const MONTH_SLUGS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export type MonthSlug = (typeof MONTH_SLUGS)[number];

export function slugToMonthIndex(slug: string): MonthIndex | null {
  const i = MONTH_SLUGS.indexOf(slug as MonthSlug);
  return i >= 0 ? (i as MonthIndex) : null;
}

export function monthIndexToSlug(index: MonthIndex): MonthSlug {
  return MONTH_SLUGS[index];
}
