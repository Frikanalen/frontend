import type { RecurringSlot } from "@/generated/frikanalenDjangoAPI.schemas";

/**
 * The arithmetic behind the weekly slot planner. Everything is in minutes of
 * the Oslo week: Monday 00:00 is 0, Sunday 23:59 is 7 * 1440 - 1. Slots are
 * wall-clock rules ("Thursdays at 19:00"), so the planner never touches
 * instants or time zones.
 */

export const DAY = 24 * 60;
export const WEEK = 7 * DAY;
/** Drags snap to this many minutes. */
export const SNAP = 5;
export const MIN_DURATION = 5;

export const WEEKDAYS = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];
export const WEEKDAYS_SHORT = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

/** "19:30:00" or "19:30" to minutes after midnight. */
export const parseTime = (value: string): number => {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Minutes after midnight to "19:30". */
export const formatTime = (minutes: number): string => {
  const wrapped = ((minutes % DAY) + DAY) % DAY;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
};

/** DRF durations ("01:30:00", "1 02:00:00") to whole minutes. */
export const parseDuration = (value: string): number => {
  const [days, clock] = value.includes(" ") ? value.split(" ") : ["0", value];
  const [hours = 0, minutes = 0, seconds = 0] = clock.split(":").map(Number);
  return Number(days) * DAY + hours * 60 + minutes + Math.round(seconds / 60);
};

/** Minutes to the "HH:MM:SS" DRF reads, days folded into hours. */
export const durationPayload = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;

/** Minutes to "1 t 30 min". */
export const formatLength = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} t ${rest} min` : `${hours} t`;
};

export const snap = (minutes: number, step = SNAP) => Math.round(minutes / step) * step;

export const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/** The weekdays a slot airs on; a daily slot with none airs every day. */
export const slotDays = (slot: Pick<RecurringSlot, "frequency" | "weekdays">): number[] => {
  const days = [...new Set(slot.weekdays ?? [])].sort((a, b) => a - b);
  if (slot.frequency === "daily" && days.length === 0) return [0, 1, 2, 3, 4, 5, 6];
  return days;
};

/** Every week, or a short phrase for the rarer patterns. */
export const recurrenceLabel = (
  slot: Pick<RecurringSlot, "frequency" | "interval" | "monthWeeks">,
): string | null => {
  const interval = slot.interval ?? 1;
  if (slot.frequency === "monthly") {
    const weeks = (slot.monthWeeks ?? [])
      .slice()
      .sort((a, b) => (a === -1 ? 9 : a) - (b === -1 ? 9 : b))
      .map((week) => (week === -1 ? "siste" : `${week}.`))
      .join(", ");
    const every = interval === 1 ? "hver måned" : `hver ${interval}. måned`;
    return `${weeks} i ${every}`;
  }
  if (slot.frequency === "daily") return interval === 1 ? null : `hver ${interval}. dag`;
  if (interval === 1) return null;
  return interval === 2 ? "annenhver uke" : `hver ${interval}. uke`;
};

/** A slot's shape on the planner, which a drag can change before it's saved. */
export type Shape = { days: number[]; start: number; duration: number };

export const shapeOf = (slot: RecurringSlot): Shape => ({
  days: slotDays(slot),
  start: parseTime(slot.startTime),
  duration: parseDuration(slot.duration),
});

/**
 * A block to draw: the part of one occurrence that falls on one day. An
 * occurrence that runs past midnight is two blocks, the second continuing at
 * the top of the next day (Sunday night wraps to Monday).
 */
export type Block = {
  /** The weekday the occurrence starts on, which a drag moves. */
  day: number;
  /** The column the block is drawn in. */
  column: number;
  top: number;
  bottom: number;
  continued: boolean;
};

export const blocksOf = ({ days, start, duration }: Shape): Block[] =>
  days.flatMap((day) => {
    const blocks: Block[] = [];
    let from = start;
    let left = Math.min(duration, WEEK);
    let column = day;
    while (left > 0) {
      const to = Math.min(DAY, from + left);
      blocks.push({ day, column: column % 7, top: from, bottom: to, continued: from !== start });
      left -= to - from;
      from = 0;
      column += 1;
    }
    return blocks;
  });

/** Week-minute windows the shape occupies, for comparing against others. */
const windowsOf = ({ days, start, duration }: Shape): [number, number][] =>
  days.flatMap((day): [number, number][] => {
    const from = day * DAY + start;
    const to = from + duration;
    // Sunday night runs into next Monday: compare that part at the week's start.
    return to > WEEK
      ? [
          [from, WEEK],
          [0, to - WEEK],
        ]
      : [[from, to]];
  });

export const shapesOverlap = (a: Shape, b: Shape) =>
  windowsOf(a).some(([s1, e1]) => windowsOf(b).some(([s2, e2]) => s1 < e2 && s2 < e1));

/**
 * Whether two slots can ever be on air at once, as far as the planner can
 * tell: their weekly shapes overlap and their date ranges do too. Patterns
 * that skip weeks may still never meet; the server has the last word.
 */
export const slotsMayCollide = (
  a: Pick<RecurringSlot, "startsOn" | "endsOn">,
  shapeA: Shape,
  b: Pick<RecurringSlot, "startsOn" | "endsOn">,
  shapeB: Shape,
) => {
  const datesMeet = (!a.endsOn || a.endsOn >= b.startsOn) && (!b.endsOn || b.endsOn >= a.startsOn);
  return datesMeet && shapesOverlap(shapeA, shapeB);
};

/**
 * Where a dragged occurrence lands: `from` is the weekday it was picked up
 * on, `to` where it was dropped. On a multi-day slot only that weekday moves,
 * and it can't land on a day the slot already has.
 */
export const moveDay = (days: number[], from: number, to: number): number[] | null => {
  if (from === to) return days;
  if (days.includes(to)) return null;
  return days.map((day) => (day === from ? to : day)).sort((a, b) => a - b);
};

/** Today's date in Oslo as "YYYY-MM-DD". */
export const osloToday = (now = new Date()): string =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(now);

/** Whether a slot still issues airtime from `today` on. */
export const isCurrent = (slot: Pick<RecurringSlot, "endsOn">, today: string) =>
  !slot.endsOn || slot.endsOn >= today;

/**
 * A steady colour per organization, so one organization's slots read as a
 * group across the week. Hues are spread by the golden angle from the id.
 */
export const organizationHue = (organizationId: number | null | undefined): number | null =>
  organizationId == null ? null : Math.round((organizationId * 137.508) % 360);

const listJoin = (parts: string[]) =>
  parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} og ${parts.at(-1)}`;

/** "Hver torsdag 19:00–20:00", in Norwegian, for headings and labels. */
export const describeSlot = (slot: RecurringSlot): string => {
  const { days, start, duration } = shapeOf(slot);
  const time = `${formatTime(start)}–${formatTime(start + duration)}`;
  const names = days.map((day) => WEEKDAYS[day].toLowerCase());
  const pattern = recurrenceLabel(slot);
  if (slot.frequency === "monthly") return `${listJoin(names)}, ${pattern}, ${time}`;
  const which = days.length === 7 ? "hver dag" : `hver ${listJoin(names)}`;
  return `${pattern ? `${which}, ${pattern}` : which} ${time}`.replace(/^h/, "H");
};
