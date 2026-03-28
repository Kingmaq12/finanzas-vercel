import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { FinanceBundle } from "@/lib/types";

export const financeState = pgTable("finance_state", {
  id: text("id").primaryKey().default("default"),
  payload: jsonb("payload").notNull().$type<FinanceBundle>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
