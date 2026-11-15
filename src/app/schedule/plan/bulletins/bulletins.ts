import { osloInstant } from "@/app/requests/dates";
import type { Bulletin } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatOsloDateISO } from "@/lib/formatOsloDateISO";
import { inOsloTime } from "@/lib/osloTime";
import { format } from "date-fns";

/** A point in time as the form holds it: an Oslo date and minutes after midnight. */
export type When = { date: string; minutes: number };

export const whenOf = (instant: string | null | undefined): When | null => {
  if (!instant) return null;
  const oslo = inOsloTime(instant);
  return {
    date: formatOsloDateISO(new Date(instant)),
    minutes: oslo.getHours() * 60 + oslo.getMinutes(),
  };
};

export const instantOf = (when: When | null) =>
  when && when.date ? osloInstant(when.date, when.minutes) : null;

/** "20.11. kl. 18:00", on Oslo's clock. */
export const whenText = (instant: string) => format(inOsloTime(instant), "d.M. 'kl.' HH:mm");

export type BulletinStatus = "draft" | "waiting" | "showing" | "over";

/** Where a bulletin is in its life, at `now`. */
export const statusOf = (
  bulletin: Pick<Bulletin, "isPublished" | "startsAt" | "endsAt">,
  now: number,
): BulletinStatus => {
  if (bulletin.endsAt && Date.parse(bulletin.endsAt) <= now) return "over";
  if (!bulletin.isPublished) return "draft";
  if (bulletin.startsAt && Date.parse(bulletin.startsAt) > now) return "waiting";
  return "showing";
};

/** The status in words, with the time that matters for it. */
export const statusText = (
  bulletin: Pick<Bulletin, "isPublished" | "startsAt" | "endsAt">,
  now: number,
) => {
  const status = statusOf(bulletin, now);
  if (status === "over") return `Ferdig ${whenText(bulletin.endsAt!)}`;
  if (status === "draft") return "Utkast";
  if (status === "waiting") return `Starter ${whenText(bulletin.startsAt!)}`;
  return bulletin.endsAt ? `Vises nå, til ${whenText(bulletin.endsAt)}` : "Vises nå";
};

/** Where it shows, in words. */
export const placesText = (bulletin: Pick<Bulletin, "onAir" | "onInfographics">) =>
  [bulletin.onAir && "på lufta", bulletin.onInfographics && "i infografikken"]
    .filter(Boolean)
    .join(" og ") || "ingen steder";

/*
 * On air a bulletin is shown whole or not at all. A gap between programmes
 * also holds the opening (3.2 s), the slate coming up (2.3 s), the schedule
 * (at least 12 s) and the fade out (0.5 s): on-air-graphics, tiers.ts.
 */
const AROUND_A_BULLETIN_SECONDS = 18;

/** The shortest gap between programmes this bulletin fits in. */
export const shortestGapSeconds = (readingSeconds: number) =>
  readingSeconds + AROUND_A_BULLETIN_SECONDS;

export const PRIORITIES = [
  { value: 1, label: "Høy: vises først" },
  { value: 0, label: "Vanlig" },
  { value: -1, label: "Lav: vises sist" },
] as const;
