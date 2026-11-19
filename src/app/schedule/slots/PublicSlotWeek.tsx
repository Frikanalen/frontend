import type { PublicRecurringSlot } from "@/generated/frikanalenDjangoAPI.schemas";
import Link from "next/link";
import {
  DAY,
  WEEKDAYS,
  blocksOf,
  formatLength,
  formatTime,
  organizationHue,
  parseDuration,
  parseTime,
  recurrenceLabel,
  slotDays,
  type Shape,
} from "@/app/schedule/plan/slots/slots";

const HOUR_PX = 40;
const PX_PER_MINUTE = HOUR_PX / 60;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const shapeOf = (slot: PublicRecurringSlot): Shape => ({
  days: slotDays(slot),
  start: parseTime(slot.startTime),
  duration: parseDuration(slot.duration),
});

/** Who the slot's airtime belongs to, as the public reads it. */
export const holderName = (slot: PublicRecurringSlot) =>
  slot.organization?.name ?? (slot.jukebox ? "Frikanalen, fra arkivet" : "Frikanalen");

/** One steady colour per organization; the station's own time is grey or plum. */
const colour = (slot: PublicRecurringSlot) => {
  if (slot.jukebox) return "var(--color-brand-plum)";
  const hue = organizationHue(slot.organization?.id);
  return hue === null ? "oklch(0.45 0 0)" : `oklch(0.48 0.1 ${hue})`;
};

const Holder = ({ slot }: { slot: PublicRecurringSlot }) =>
  slot.organization ? (
    <Link
      className="font-semibold text-link hover:underline"
      href={`/organization/${slot.organization.id}`}
    >
      {slot.organization.name}
    </Link>
  ) : (
    <span className="font-semibold">{holderName(slot)}</span>
  );

/**
 * The regular week drawn as a timetable: one column per weekday, each slot
 * where it airs, in its holder's colour. Read only; for wide screens.
 */
const WeekGrid = ({ slots }: { slots: PublicRecurringSlot[] }) => (
  <div className="hidden bg-background md:block" aria-hidden>
    <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] border-b border-default-200 text-sm font-semibold">
      <div />
      {WEEKDAYS.map((day) => (
        <div className="px-2 py-2 text-center" key={day}>
          {day}
        </div>
      ))}
    </div>
    <div
      className="relative grid grid-cols-[3rem_repeat(7,minmax(0,1fr))]"
      style={{ height: 24 * HOUR_PX }}
    >
      <div className="relative">
        {HOURS.map((hour) => (
          <div
            className="absolute right-2 -translate-y-1/2 text-xs text-default-500 tabular-nums"
            key={hour}
            style={{ top: hour * HOUR_PX }}
          >
            {hour ? formatTime(hour * 60) : null}
          </div>
        ))}
      </div>
      {WEEKDAYS.map((day, column) => (
        <div className="relative border-s border-default-200" key={day}>
          {HOURS.map((hour) => (
            <div
              className="absolute inset-x-0 border-t border-default-100"
              key={hour}
              style={{ top: hour * HOUR_PX }}
            />
          ))}
          {slots.flatMap((slot) =>
            blocksOf(shapeOf(slot))
              .filter((block) => block.column === column)
              .map((block) => {
                const { start, duration } = shapeOf(slot);
                const height = (block.bottom - block.top) * PX_PER_MINUTE;
                const pattern = recurrenceLabel(slot);
                return (
                  <div
                    className="absolute inset-x-0.5 overflow-hidden rounded-sm px-1.5 text-xs leading-tight text-white"
                    key={`${slot.id}-${block.day}-${block.top}`}
                    style={{
                      top: block.top * PX_PER_MINUTE + 1,
                      height: Math.max(height - 2, 3),
                      backgroundColor: colour(slot),
                    }}
                    title={`${holderName(slot)}, ${formatTime(start)}–${formatTime(start + duration)}${pattern ? ` (${pattern})` : ""}`}
                  >
                    {height >= 14 ? (
                      <div className="truncate pt-0.5 font-semibold">{holderName(slot)}</div>
                    ) : null}
                    {height >= 34 ? (
                      <div className="truncate opacity-85 tabular-nums">
                        {formatTime(start)}–{formatTime(start + duration)}
                        {pattern ? `, ${pattern}` : ""}
                      </div>
                    ) : null}
                  </div>
                );
              }),
          )}
        </div>
      ))}
    </div>
  </div>
);

/** The same week as a list per day: what phones and screen readers get. */
const DayList = ({ slots }: { slots: PublicRecurringSlot[] }) => (
  <div className="space-y-6 md:sr-only">
    {WEEKDAYS.map((day, index) => {
      const today = slots
        .filter((slot) => shapeOf(slot).days.includes(index))
        .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
      return (
        <section key={day}>
          <h3 className="border-b border-default-200 pb-1 text-lg font-bold">{day}</h3>
          {today.length ? (
            <ul className="divide-y divide-default-100">
              {today.map((slot) => {
                const { start, duration } = shapeOf(slot);
                const pattern = recurrenceLabel(slot);
                return (
                  <li className="flex gap-3 py-2" key={slot.id}>
                    <span
                      aria-hidden
                      className="mt-1.5 size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: colour(slot) }}
                    />
                    <span className="w-28 shrink-0 tabular-nums">
                      {formatTime(start)}–{formatTime(start + duration)}
                    </span>
                    <span className="min-w-0">
                      <Holder slot={slot} />
                      {pattern ? <span className="text-default-600">, {pattern}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-2 text-default-600">Ingen faste sendeflater.</p>
          )}
        </section>
      );
    })}
  </div>
);

/** Weekly minutes per holder, most first. Rarer patterns count as if weekly. */
const totals = (slots: PublicRecurringSlot[]) => {
  const byHolder = new Map<string, { slot: PublicRecurringSlot; minutes: number }>();
  for (const slot of slots) {
    const key = slot.organization
      ? `org-${slot.organization.id}`
      : slot.jukebox
        ? "jukebox"
        : "station";
    const { days, duration } = shapeOf(slot);
    const entry = byHolder.get(key) ?? { slot, minutes: 0 };
    entry.minutes += days.length * duration;
    byHolder.set(key, entry);
  }
  return [...byHolder.values()].sort((a, b) => b.minutes - a.minutes);
};

export const PublicSlotWeek = ({ slots }: { slots: PublicRecurringSlot[] }) => {
  const free = WEEKDAYS.length * DAY - totals(slots).reduce((sum, { minutes }) => sum + minutes, 0);
  return (
    <div className="space-y-10">
      <WeekGrid slots={slots} />
      <DayList slots={slots} />
      <section className="max-w-3xl space-y-3">
        <h2 className="text-2xl font-bold">Hvem har faste sendeflater</h2>
        <ul className="divide-y divide-default-100 border-y border-default-200">
          {totals(slots).map(({ slot, minutes }) => (
            <li className="flex items-center gap-3 py-2" key={slot.id}>
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: colour(slot) }}
              />
              <span className="min-w-0 grow">
                <Holder slot={slot} />
              </span>
              <span className="shrink-0 text-default-600 tabular-nums">
                {formatLength(minutes)} i uken
              </span>
            </li>
          ))}
        </ul>
        {free > 0 ? (
          <p className="text-default-600">
            Resten av uken, {formatLength(free)}, har ingen fast sendeflate. Den kan gis som
            enkeltstående sendetid eller brukes til Frikanalens egne sendinger. Tid som står tom,
            viser kanalgrafikk.
          </p>
        ) : null}
      </section>
    </div>
  );
};
