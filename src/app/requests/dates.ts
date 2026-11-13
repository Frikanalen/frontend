import { osloToday } from "@/app/schedule/plan/slots/slots";
import { OSLO_TIME_ZONE } from "@/lib/osloTime";
import { TZDate } from "@date-fns/tz/date";

/** The Oslo date of the next `weekday` after today, as "YYYY-MM-DD". */
export const nextDate = (weekday: number, today = osloToday()) => {
  const date = new Date(`${today}T12:00:00Z`);
  const ahead = (weekday - ((date.getUTCDay() + 6) % 7) + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + ahead);
  return date.toISOString().slice(0, 10);
};

export const weekdayOf = (date: string) => (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;

export const tomorrow = () => {
  const date = new Date(`${osloToday()}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

/** A wall-clock date and time in Oslo, as the instant the API wants. */
export const osloInstant = (date: string, minutes: number) => {
  const [year, month, day] = date.split("-").map(Number);
  return new TZDate(year, month - 1, day, 0, minutes, OSLO_TIME_ZONE).toISOString();
};
