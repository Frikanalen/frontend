import { format } from "date-fns";
import { TZDate } from "@date-fns/tz/date";

// Frikanalen broadcasts from Norway on a Norwegian schedule: the API serves a
// day's programmes by Oslo date, and the on-air clock is Oslo's. So every time
// we put on screen reads from that clock, and a viewer in Berlin or Boston sees
// the same grid as one in Drammen rather than their own shift of it.
export const OSLO_TIME_ZONE = "Europe/Oslo";

// The same instant, read on Frikanalen's clock. date-fns v4 defers to whatever
// date object it is handed, so a TZDate formats — and reports its getHours() —
// in Oslo no matter where the code is running.
export const inOsloTime = (instant: string | Date) =>
  // Normalised to a Date first: TZDate's string overload reads a bare date-time
  // as wall-clock in the target zone, and these are absolute instants.
  new TZDate(typeof instant === "string" ? new Date(instant) : instant, OSLO_TIME_ZONE);

/** A programme's start time as it appears in the schedule: "19:30", Oslo. */
export const formatOsloTime = (instant: string | Date) => format(inOsloTime(instant), "HH:mm");
