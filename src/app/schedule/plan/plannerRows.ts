import type { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { OSLO_TIME_ZONE, inOsloTime } from "@/lib/osloTime";
import { TZDate } from "@date-fns/tz/date";
import { addDays, format } from "date-fns";

export type PlannerRow =
  { kind: "gap"; start: Date; end: Date } | { kind: "item"; item: ScheduleitemRead };

export const osloDate = (instant: string | Date) => format(inOsloTime(instant), "yyyy-MM-dd");

export const osloDateTime = (date: string, time: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new TZDate(year, month - 1, day, hour, minute, 0, OSLO_TIME_ZONE);
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

export const plannerRows = (items: ScheduleitemRead[], date: string): PlannerRow[] => {
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

  for (const item of visible) {
    const start = Math.max(new Date(item.starttime).getTime(), dayStart.getTime());
    const end = Math.min(new Date(item.endtime).getTime(), dayEnd.getTime());

    if (start > cursor) rows.push({ kind: "gap", start: new Date(cursor), end: new Date(start) });
    rows.push({ kind: "item", item });
    cursor = Math.max(cursor, end);
  }

  if (cursor < dayEnd.getTime()) {
    rows.push({ kind: "gap", start: new Date(cursor), end: dayEnd });
  }

  return rows;
};
