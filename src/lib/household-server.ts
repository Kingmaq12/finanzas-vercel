import { getDb } from "@/db";
import { householdCalendarEvents, householdMembers, sharedHouseholdState } from "@/db/schema";
import {
  createDefaultSharedPayload,
  isSharedHouseholdPayload,
  type SharedHouseholdPayload,
} from "@/lib/shared-household-types";
import { and, eq, gt, isNull } from "drizzle-orm";

export async function getHouseholdIdForUser(userId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .limit(1);
  return rows[0]?.householdId ?? null;
}

export async function getSharedPayload(householdId: string): Promise<SharedHouseholdPayload | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(sharedHouseholdState)
    .where(eq(sharedHouseholdState.householdId, householdId))
    .limit(1);
  const p = rows[0]?.payload;
  if (p && isSharedHouseholdPayload(p)) return p;
  return null;
}

export async function upsertSharedPayload(
  householdId: string,
  payload: SharedHouseholdPayload,
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("No database");
  const next: SharedHouseholdPayload = { ...payload, version: 1 };
  const existing = await db
    .select()
    .from(sharedHouseholdState)
    .where(eq(sharedHouseholdState.householdId, householdId))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(sharedHouseholdState).values({
      householdId,
      payload: next,
      updatedAt: new Date(),
    });
  } else {
    await db
      .update(sharedHouseholdState)
      .set({ payload: next, updatedAt: new Date() })
      .where(eq(sharedHouseholdState.householdId, householdId));
  }
}

export async function ensureSharedStateRow(householdId: string): Promise<SharedHouseholdPayload> {
  const cur = await getSharedPayload(householdId);
  if (cur) return cur;
  const empty = createDefaultSharedPayload();
  await upsertSharedPayload(householdId, empty);
  return empty;
}

export type CalendarEventRow = {
  id: string;
  householdId: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  notes: string | null;
  notifyEnabled: boolean;
  notifyEmails: string[];
  notifyMinutesBefore: number;
  lastNotifiedAt: string | null;
};

export async function listCalendarEvents(householdId: string): Promise<CalendarEventRow[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(householdCalendarEvents)
    .where(eq(householdCalendarEvents.householdId, householdId));
  return rows
    .map((r) => ({
      id: r.id,
      householdId: r.householdId,
      title: r.title,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt?.toISOString() ?? null,
      notes: r.notes,
      notifyEnabled: r.notifyEnabled,
      notifyEmails: Array.isArray(r.notifyEmails) ? r.notifyEmails : [],
      notifyMinutesBefore: r.notifyMinutesBefore ?? 1440,
      lastNotifiedAt: r.lastNotifiedAt?.toISOString() ?? null,
    }))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function markEventNotified(eventId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(householdCalendarEvents)
    .set({ lastNotifiedAt: new Date() })
    .where(eq(householdCalendarEvents.id, eventId));
}

/** Eventos con notificación activa, sin enviar aún, con inicio en el futuro. */
export async function listEventsPendingNotification() {
  const db = getDb();
  if (!db) return [];
  const now = new Date();
  return db
    .select()
    .from(householdCalendarEvents)
    .where(
      and(
        eq(householdCalendarEvents.notifyEnabled, true),
        isNull(householdCalendarEvents.lastNotifiedAt),
        gt(householdCalendarEvents.startsAt, now),
      ),
    );
}
