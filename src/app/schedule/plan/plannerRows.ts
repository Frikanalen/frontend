import type { ScheduleitemRead, WeeklySlotRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { OSLO_TIME_ZONE, inOsloTime } from "@/lib/osloTime";
import { TZDate } from "@date-fns/tz/date";
import { addDays, addMilliseconds, format, subDays } from "date-fns";
import { durationMilliseconds } from "./duration";

export const MINIMUM_PLANNER_GAP_MILLISECONDS = 10 * 60 * 1000;

export type PlannerRow =
  | { kind: "gap"; start: Date; end: Date }
  | { kind: "item"; item: ScheduleitemRead }
  | {
      kind: "weeklySlot";
      slot: WeeklySlotRead;
      start: Date;
      end: Date;
      items: ScheduleitemRead[];
    };

export const osloDate = (instant: string | Date) => format(inOsloTime(instant), "yyyy-MM-dd");

export const osloDateTime = (date: string, time: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second = 0] = time.split(":").map(Number);
  return new TZDate(year, month - 1, day, hour, minute, second, OSLO_TIME_ZONE);
};

export const plannerItemBounds = (item: ScheduleitemRead, date: string) => {
  const dayStart = osloDateTime(date, "00:00");
  const dayEnd = addDays(dayStart, 1);

  return {
    start: new Date(Math.max(new Date(item.starttime).getTime(), dayStart.getTime())),
    end: new Date(Math.min(new Date(item.endtime).getTime(), dayEnd.getTime())),
  };
};

export const openDates = (freezeBoundary: string, schedulingHorizon: string) => {
  const dates: string[] = [];
  let cursor = inOsloTime(freezeBoundary);
  const horizon = new Date(schedulingHorizon);

  while (cursor < horizon) {
    dates.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
  return dates;
};

const overlaps = (start: Date, end: Date, otherStart: Date, otherEnd: Date) =>
  start < otherEnd && end > otherStart;

const osloWeekday = (instant: Date) => (instant.getDay() + 6) % 7;

const weeklySlotRows = (
  slots: readonly WeeklySlotRead[],
  items: ScheduleitemRead[],
  dayStart: Date,
  dayEnd: Date,
) => {
  const rows: Extract<PlannerRow, { kind: "weeklySlot" }>[] = [];

  // Looking back one complete week also covers slots that begin on an
  // earlier day and continue across midnight into the selected day.
  for (let daysAgo = 0; daysAgo < 7; daysAgo += 1) {
    const occurrenceDay = subDays(dayStart, daysAgo);
    const occurrenceDate = format(occurrenceDay, "yyyy-MM-dd");

    for (const slot of slots) {
      if (slot.day !== osloWeekday(occurrenceDay)) continue;
      const milliseconds = durationMilliseconds(slot.duration);
      if (milliseconds === undefined || milliseconds <= 0) continue;

      const start = osloDateTime(occurrenceDate, slot.startTime);
      const end = addMilliseconds(start, milliseconds);
      if (!overlaps(start, end, dayStart, dayEnd)) continue;

      // A slot is an airtime reservation the scheduler fills with one or
      // more programmes, so it owns the items that name it.
      const members = items
        .filter(
          (item) =>
            item.weeklySlot === slot.id &&
            overlaps(start, end, new Date(item.starttime), new Date(item.endtime)),
        )
        .sort((a, b) => new Date(a.starttime).getTime() - new Date(b.starttime).getTime());

      // Programming may overrun its reservation; the row still has to cover
      // it so the surrounding gaps stay honest.
      const spanStart = members.length
        ? new Date(
            Math.min(start.getTime(), ...members.map((item) => new Date(item.starttime).getTime())),
          )
        : start;
      const spanEnd = members.length
        ? new Date(
            Math.max(end.getTime(), ...members.map((item) => new Date(item.endtime).getTime())),
          )
        : end;

      rows.push({ kind: "weeklySlot", slot, start: spanStart, end: spanEnd, items: members });
    }
  }

  return rows;
};

export const plannerRows = (
  items: ScheduleitemRead[],
  slots: readonly WeeklySlotRead[],
  date: string,
): PlannerRow[] => {
  const dayStart = osloDateTime(date, "00:00");
  const dayEnd = addDays(dayStart, 1);
  const rows: PlannerRow[] = [];
  let cursor = dayStart.getTime();

  const visible = items
    .filter(
      (item) =>
        new Date(item.starttime).getTime() < dayEnd.getTime() &&
        new Date(item.endtime).getTime() > dayStart.getTime(),
    )
    .sort((a, b) => new Date(a.starttime).getTime() - new Date(b.starttime).getTime());

  const slotRows = weeklySlotRows(slots, visible, dayStart, dayEnd);
  const claimed = new Set(slotRows.flatMap((row) => row.items.map((item) => item.id)));

  const timeline: Exclude<PlannerRow, { kind: "gap" }>[] = [
    ...visible
      .filter((item) => !claimed.has(item.id))
      .map((item) => ({ kind: "item" as const, item })),
    ...slotRows,
  ].sort((a, b) => {
    const aStart = new Date(a.kind === "item" ? a.item.starttime : a.start).getTime();
    const bStart = new Date(b.kind === "item" ? b.item.starttime : b.start).getTime();
    return aStart - bStart;
  });

  const addGap = (start: number, end: number) => {
    if (end - start >= MINIMUM_PLANNER_GAP_MILLISECONDS) {
      rows.push({ kind: "gap", start: new Date(start), end: new Date(end) });
    }
  };

  for (const entry of timeline) {
    const entryStart = entry.kind === "item" ? new Date(entry.item.starttime) : entry.start;
    const entryEnd = entry.kind === "item" ? new Date(entry.item.endtime) : entry.end;
    const start = Math.max(entryStart.getTime(), dayStart.getTime());
    const end = Math.min(entryEnd.getTime(), dayEnd.getTime());

    if (start > cursor) addGap(cursor, start);
    rows.push(entry);
    cursor = Math.max(cursor, end);
  }

  if (cursor < dayEnd.getTime()) {
    addGap(cursor, dayEnd.getTime());
  }

  return rows;
};
