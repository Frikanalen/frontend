import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale/nb";

/**
 * A running time as a player shows it: "8:14", or "1:03:20" once it passes an
 * hour. Minutes are only zero-padded when an hour field precedes them, which
 * is the convention every video player uses and the one a reader will already
 * be fluent in.
 *
 * Rounded rather than truncated: the API reports fractional seconds, and a
 * 59.7-second video that says 0:59 is a worse lie than one that says 1:00.
 */
export const formatDuration = (seconds: number) => {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const rest = String(total % 60).padStart(2, "0");

  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
};

/**
 * The same running time in words, for the badge's accessible name.
 *
 * "1:03:20" is read out as a time of day, or as three numbers, depending on
 * the screen reader - neither of which is a length. Spelling it out costs
 * nothing and is unambiguous however it is voiced.
 *
 * Cut off below the minute above a minute: nobody chooses a video by its
 * seconds, and "1 time og 3 minutter" is the useful half of "1:03:20". It
 * takes the same floored fields the badge shows rather than rounding them, so
 * the two never disagree about the number a reader can see.
 */
export const spokenDuration = (seconds: number) => {
  const total = Math.round(seconds);
  if (total < 60) return `${total} sekunder`;

  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);

  const parts = [
    hours && `${hours} ${hours === 1 ? "time" : "timer"}`,
    minutes && `${minutes} ${minutes === 1 ? "minutt" : "minutter"}`,
  ].filter(Boolean);

  return parts.join(" og ");
};

/**
 * When a video arrived, as "4. apr. 2025".
 *
 * Abbreviated because it sits in a line of metadata under a title, where the
 * month spelled out in full would be the widest thing on the row and the
 * least important. The day is kept: this archive spans 2009 to now, and two
 * recordings of the same weekly programme are often only told apart by it.
 */
export const formatPublished = (instant: string) =>
  format(parseISO(instant), "d. MMM yyyy", { locale: nb });
