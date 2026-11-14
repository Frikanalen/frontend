import { osloToday } from "@/app/schedule/plan/slots/slots";
import type { AirtimeGrant } from "@/generated/frikanalenDjangoAPI.schemas";
import { inOsloTime } from "@/lib/osloTime";
import { format } from "date-fns";

export const DAY_MINUTES = 24 * 60;

const noon = (date: string) => new Date(`${date}T12:00:00Z`);

/** `date` moved by `days`, both as "YYYY-MM-DD". */
export const addDays = (date: string, days: number) => {
  const moved = noon(date);
  moved.setUTCDate(moved.getUTCDate() + days);
  return moved.toISOString().slice(0, 10);
};

/** The Monday of the week `date` is in. */
export const mondayOf = (date: string) => addDays(date, -((noon(date).getUTCDay() + 6) % 7));

/** A week as the page's address gives it, or this week if it gives none. */
export const parseWeek = (value: string | undefined, today = osloToday()) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(noon(value).getTime())
    ? mondayOf(value)
    : mondayOf(today);

/** ISO week number, as Norwegian calendars print it. */
export const weekNumber = (monday: string) => {
  const thursday = noon(addDays(monday, 3));
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1, 12));
  return Math.floor((thursday.getTime() - yearStart.getTime()) / (7 * 86_400_000)) + 1;
};

/** Where an instant falls in Oslo: its date and minutes after midnight. */
export const osloPlace = (instant: string) => {
  const local = inOsloTime(instant);
  return {
    date: format(local, "yyyy-MM-dd"),
    minute: local.getHours() * 60 + local.getMinutes(),
  };
};

export type DayBlock = { day: number; top: number; bottom: number; first: boolean };

/**
 * A stretch of time drawn on the week starting `monday`: one block per day
 * it touches (a stretch past midnight goes on into the next column), clipped
 * to the week.
 */
export const blocksBetween = (starttime: string, endtime: string, monday: string): DayBlock[] => {
  const start = osloPlace(starttime);
  const end = osloPlace(endtime);
  const dayIndex = (date: string) =>
    Math.round((noon(date).getTime() - noon(monday).getTime()) / 86_400_000);
  const first = dayIndex(start.date);
  // An end at exactly midnight belongs to the day before.
  const last = end.minute === 0 ? dayIndex(end.date) - 1 : dayIndex(end.date);
  const blocks: DayBlock[] = [];
  for (let day = Math.max(first, 0); day <= Math.min(last, 6); day++) {
    const top = day === first ? start.minute : 0;
    const bottom = day === last && end.minute !== 0 ? end.minute : DAY_MINUTES;
    if (bottom > top) blocks.push({ day, top, bottom, first: day === first });
  }
  return blocks;
};

/** Grants that share any time with the stretch, cancelled ones left out. */
export const overlapping = (
  grants: readonly AirtimeGrant[],
  starttime: string,
  endtime: string,
) => {
  const from = Date.parse(starttime);
  const to = Date.parse(endtime);
  return grants.filter(
    (grant) =>
      grant.state !== "cancelled" &&
      Date.parse(grant.starttime) < to &&
      Date.parse(grant.endtime) > from,
  );
};
