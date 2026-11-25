import { TZDate } from "@date-fns/tz/date";
import { addDays, format } from "date-fns";
import { inOsloTime, OSLO_TIME_ZONE } from "@/lib/osloTime";

/** How much one playlist covers from the chosen moment. The API allows six hours. */
export const PLAYLIST_HOURS = 3;

export type Span = { start: string; end: string };
export type Coverage = { segmentSeconds: number; spans: Span[] };

/** Midnight to midnight of an Oslo date ("2026-11-25"), across DST changes too. */
export const osloDay = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const start = new TZDate(year, month - 1, day, OSLO_TIME_ZONE);
  return { start: new Date(start), end: new Date(addDays(start, 1)) };
};

/** An Oslo date and wall-clock time ("16:05" or "16:05:30") as an instant. */
export const osloInstant = (date: string, time: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes, seconds = 0] = time.split(":").map(Number);
  return new Date(new TZDate(year, month - 1, day, hours, minutes, seconds, OSLO_TIME_ZONE));
};

export const osloDateOf = (instant: Date) => format(inOsloTime(instant), "yyyy-MM-dd");
export const osloClockOf = (instant: Date) => format(inOsloTime(instant), "HH:mm:ss");

export const coverageUrl = (start: Date, end: Date) =>
  `/api/airlog/coverage?${new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  })}`;

/** A playlist from `start`; while its end is still to come it follows the recording live. */
export const playlistUrl = (start: Date) =>
  `/api/airlog/playlist.m3u8?${new URLSearchParams({
    start: start.toISOString(),
    end: new Date(start.getTime() + PLAYLIST_HOURS * 3600_000).toISOString(),
  })}`;

/** Where a span sits on a day's timeline, as left and width percentages. */
export const spanPosition = (span: Span, day: { start: Date; end: Date }) => {
  const length = day.end.getTime() - day.start.getTime();
  const from = Math.max(new Date(span.start).getTime(), day.start.getTime());
  const to = Math.min(new Date(span.end).getTime(), day.end.getTime());
  return {
    left: ((from - day.start.getTime()) / length) * 100,
    width: (Math.max(0, to - from) / length) * 100,
  };
};

/** The instant at a fraction (0..1) of the way along a day's timeline, to the minute. */
export const instantAt = (fraction: number, day: { start: Date; end: Date }) => {
  const length = day.end.getTime() - day.start.getTime();
  const at = day.start.getTime() + Math.min(1, Math.max(0, fraction)) * length;
  return new Date(Math.floor(at / 60_000) * 60_000);
};
