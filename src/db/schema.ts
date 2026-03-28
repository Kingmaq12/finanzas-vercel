import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { FinanceBundle } from "@/lib/types";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  /** Siempre en minúsculas para login estable. */
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const financeState = pgTable("finance_state", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  payload: jsonb("payload").notNull().$type<FinanceBundle>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
