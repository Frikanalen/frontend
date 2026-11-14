"use client";
import { osloInstant } from "@/app/requests/dates";
import {
  WEEKDAYS,
  WEEKDAYS_SHORT,
  clamp,
  formatLength,
  formatTime,
  organizationHue,
  osloToday,
  snap,
} from "@/app/schedule/plan/slots/slots";
import { isAutomatic, listMilliseconds, windowMilliseconds } from "@/app/grants/grants";
import { DayField } from "@/components/time/DayField";
import type { AirtimeGrant, Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantsList } from "@/generated/grants/grants";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import cx from "classnames";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { GoChevronLeft, GoChevronRight, GoLock } from "react-icons/go";
import { GrantPanel } from "./GrantPanel";
import { NewAirtimePanel, type Selection } from "./NewAirtimePanel";
import { addDays, blocksBetween, mondayOf, osloPlace, weekNumber } from "./week";

const HOUR_PX = 40;
const PX_PER_MINUTE = HOUR_PX / 60;
const DAY = 24 * 60;

type Drag = { day: number; anchor: number; current: number };

const grantStyle = (organizationId: number) => {
  const hue = organizationHue(organizationId);
  return { backgroundColor: hue === null ? "oklch(0.45 0 0)" : `oklch(0.48 0.1 ${hue})` };
};

const longDate = (date: string) => format(new Date(`${date}T12:00:00`), "d. MMMM", { locale: nb });

/**
 * The staff's week: every grant of airtime that actually exists in one
 * calendar week, Monday to Sunday, coloured by organization. Step back and
 * forth a week at a time or jump to a date. Pick a grant to see and change
 * what is in it, or delete it; drag or tap free time to give airtime there,
 * or to set up a single video on an organization's behalf.
 */
export const StaffWeek = ({
  initialWeek,
  organizations,
}: {
  /** The Monday the page opens on, as "YYYY-MM-DD". */
  initialWeek: string;
  organizations: Organization[];
}) => {
  const [monday, setMonday] = useState(initialWeek);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [preview, setPreview] = useState<{ starttime: string; endtime: string } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = osloToday(new Date(now));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 6 * HOUR_PX - 8 });
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // The week is in the address, so a reload or a link lands on it again.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (monday === mondayOf(osloToday())) url.searchParams.delete("uke");
    else url.searchParams.set("uke", monday);
    window.history.replaceState(window.history.state, "", url);
  }, [monday]);

  const goTo = (week: string) => {
    setMonday(mondayOf(week));
    setSelectedId(null);
    setSelection(null);
  };

  const params = useMemo(
    () => ({
      // A grant from Sunday night can run on into Monday.
      starts_after: osloInstant(addDays(monday, -1), 0),
      starts_before: osloInstant(addDays(monday, 7), 0),
      limit: 500,
    }),
    [monday],
  );
  const grantsQuery = useGrantsList(params);
  const grants = useMemo(
    () =>
      (grantsQuery.data?.data.results ?? []).filter(
        (grant) =>
          grant.state !== "cancelled" &&
          blocksBetween(grant.starttime, grant.endtime, monday).length > 0,
      ),
    [grantsQuery.data, monday],
  );
  const selectedGrant = grants.find((grant) => grant.id === selectedId) ?? null;

  const point = (event: PointerEvent) => {
    const rect = bodyRef.current!.getBoundingClientRect();
    return {
      minute: clamp((event.clientY - rect.top) / PX_PER_MINUTE, 0, DAY),
      day: clamp(Math.floor(((event.clientX - rect.left) / rect.width) * 7), 0, 6),
    };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const { minute, day } = point(event);
    const anchor = snap(minute, 15);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ day, anchor, current: anchor });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag) setDrag({ ...drag, current: snap(point(event).minute, 15) });
  };
  const onPointerUp = () => {
    if (!drag) return;
    setDrag(null);
    const from = Math.min(drag.anchor, drag.current);
    const to = Math.max(drag.anchor, drag.current);
    setSelectedId(null);
    setSelection({
      date: addDays(monday, drag.day),
      start: from,
      // A tap rather than a drag asks for the common case: an hour.
      duration: to - from >= 15 ? to - from : 60,
    });
  };

  const dragPreview = drag
    ? {
        day: drag.day,
        top: Math.min(drag.anchor, drag.current),
        bottom: Math.max(drag.anchor, drag.current, Math.min(drag.anchor, drag.current) + 15),
      }
    : null;
  const shownPreview =
    selection && preview ? blocksBetween(preview.starttime, preview.endtime, monday) : [];
  const nowPlace = osloPlace(new Date(now).toISOString());
  const nowDay = Math.round(
    (Date.parse(`${nowPlace.date}T12:00:00Z`) - Date.parse(`${monday}T12:00:00Z`)) / 86_400_000,
  );

  const sunday = addDays(monday, 6);
  const isThisWeek = monday === mondayOf(today);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            aria-label="Forrige uke"
            isIconOnly
            size="sm"
            variant="secondary"
            onPress={() => goTo(addDays(monday, -7))}
          >
            <GoChevronLeft aria-hidden />
          </Button>
          <Button isDisabled={isThisWeek} size="sm" variant="secondary" onPress={() => goTo(today)}>
            Denne uken
          </Button>
          <Button
            aria-label="Neste uke"
            isIconOnly
            size="sm"
            variant="secondary"
            onPress={() => goTo(addDays(monday, 7))}
          >
            <GoChevronRight aria-hidden />
          </Button>
          <h2 aria-live="polite" className="text-xl font-bold">
            Uke {weekNumber(monday)}
            <span className="ms-2 text-base font-normal text-default-600">
              {longDate(monday)} – {longDate(sunday)} {sunday.slice(0, 4)}
            </span>
          </h2>
          <DayField
            className="ms-auto w-40"
            label="Gå til dato"
            value={monday}
            onChange={(value) => value && goTo(value)}
          />
        </div>

        {grantsQuery.isError ? <p role="alert">{formatApiError(grantsQuery.error)}</p> : null}

        <div className="overflow-x-auto bg-background">
          <div className="min-w-[44rem]">
            <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-separator text-sm font-semibold">
              <span />
              {WEEKDAYS.map((day, index) => {
                const date = addDays(monday, index);
                return (
                  <span className={cx("px-2 py-2", date === today && "text-accent")} key={day}>
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{WEEKDAYS_SHORT[index]}</span>{" "}
                    <span className="font-normal text-default-600">
                      {Number(date.slice(8))}.{Number(date.slice(5, 7))}.
                    </span>
                  </span>
                );
              })}
            </div>
            <div className="max-h-[70vh] overflow-y-auto" ref={scrollRef}>
              <div className="grid grid-cols-[3.5rem_minmax(0,1fr)]">
                <div aria-hidden className="relative" style={{ height: 24 * HOUR_PX }}>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <span
                      className="absolute right-2 -translate-y-1/2 text-xs text-default-600"
                      key={hour}
                      style={{ top: hour * HOUR_PX }}
                    >
                      {hour ? formatTime(hour * 60) : ""}
                    </span>
                  ))}
                </div>
                <div
                  className={cx(
                    "relative touch-pan-x touch-pan-y select-none",
                    drag ? "cursor-ns-resize" : "cursor-crosshair",
                  )}
                  data-testid="week-grid"
                  ref={bodyRef}
                  style={{
                    height: 24 * HOUR_PX,
                    backgroundImage: `linear-gradient(to bottom, var(--separator) 1px, transparent 1px)`,
                    backgroundSize: `100% ${HOUR_PX}px`,
                  }}
                  onPointerCancel={() => setDrag(null)}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                >
                  {Array.from({ length: 6 }, (_, index) => (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 border-l border-separator"
                      key={index}
                      style={{ left: `${((index + 1) / 7) * 100}%` }}
                    />
                  ))}

                  {grants.map((grant) => {
                    const aired = Date.parse(grant.endtime) <= now;
                    const dimmed = aired || (focus !== null && grant.organization.id !== focus);
                    const used = listMilliseconds(grant.items);
                    const window = windowMilliseconds(grant);
                    const percent = window ? Math.min(100, Math.round((used / window) * 100)) : 0;
                    const label = `${grant.organization.name}, ${formatTimeOf(grant.starttime)}–${formatTimeOf(grant.endtime)}, ${percent} % satt opp`;
                    return blocksBetween(grant.starttime, grant.endtime, monday).map((block) => (
                      <button
                        aria-label={label}
                        aria-pressed={selectedId === grant.id}
                        className={cx(
                          "absolute flex flex-col overflow-hidden px-1.5 py-0.5 text-left text-xs leading-tight text-white",
                          selectedId === grant.id && "z-10 ring-2 ring-foreground ring-offset-1",
                          dimmed && "opacity-40",
                          isAutomatic(grant) &&
                            "bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgb(255_255_255/0.14)_6px_12px)]",
                        )}
                        data-grant-id={grant.id}
                        key={`${grant.id}-${block.day}`}
                        style={{
                          ...grantStyle(grant.organization.id),
                          top: block.top * PX_PER_MINUTE,
                          height: Math.max((block.bottom - block.top) * PX_PER_MINUTE - 1, 6),
                          left: `calc(${(block.day / 7) * 100}% + 2px)`,
                          width: `calc(${100 / 7}% - 4px)`,
                        }}
                        type="button"
                        onClick={() => {
                          setSelection(null);
                          setSelectedId(grant.id);
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        <span className="flex items-center gap-1 truncate font-semibold">
                          {grant.state !== "open" && !grant.lockExempt ? (
                            <GoLock aria-hidden className="shrink-0" />
                          ) : null}
                          <span className="truncate">{grant.organization.name}</span>
                        </span>
                        {block.bottom - block.top >= 45 ? (
                          <span className="truncate opacity-90">
                            {formatTimeOf(grant.starttime)}–{formatTimeOf(grant.endtime)}
                          </span>
                        ) : null}
                        {block.bottom - block.top >= 75 ? (
                          <span className="truncate opacity-90">
                            {grant.items.length === 0 ? "Tom" : `${percent} % satt opp`}
                          </span>
                        ) : null}
                        {/* How full the list is, along the bottom edge. */}
                        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
                          <span
                            className="block h-full bg-white/80"
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                      </button>
                    ));
                  })}

                  {nowDay >= 0 && nowDay <= 6 ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute z-20 h-0.5 bg-danger"
                      style={{
                        top: nowPlace.minute * PX_PER_MINUTE,
                        left: `${(nowDay / 7) * 100}%`,
                        width: `${100 / 7}%`,
                      }}
                    />
                  ) : null}

                  {dragPreview ? (
                    <div
                      className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/15 px-1.5 text-xs font-semibold"
                      style={{
                        top: dragPreview.top * PX_PER_MINUTE,
                        height: (dragPreview.bottom - dragPreview.top) * PX_PER_MINUTE,
                        left: `calc(${(dragPreview.day / 7) * 100}% + 2px)`,
                        width: `calc(${100 / 7}% - 4px)`,
                      }}
                    >
                      {formatTime(dragPreview.top)}–{formatTime(dragPreview.bottom)}
                    </div>
                  ) : null}
                  {!drag
                    ? shownPreview.map((block) => (
                        <div
                          className="pointer-events-none absolute z-10 border-2 border-dashed border-accent bg-accent/25 px-1.5 text-xs font-semibold"
                          key={`new-${block.day}`}
                          style={{
                            top: block.top * PX_PER_MINUTE,
                            height: Math.max((block.bottom - block.top) * PX_PER_MINUTE, 6),
                            left: `calc(${(block.day / 7) * 100}% + 2px)`,
                            width: `calc(${100 / 7}% - 4px)`,
                          }}
                        >
                          Ny
                        </div>
                      ))
                    : null}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-default-600">
          Stripete sendetid fyller seg selv; ensfarget er satt opp for hånd. Linjen nederst i hver
          viser hvor mye som er satt opp.
        </p>
      </section>

      <aside className="space-y-4">
        {selectedGrant ? (
          <GrantPanel
            grant={selectedGrant}
            key={selectedGrant.id}
            now={now}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selection ? (
          <NewAirtimePanel
            grants={grants}
            now={now}
            organizations={organizations}
            selection={selection}
            onClose={() => setSelection(null)}
            onCreated={(grant) => {
              setSelection(null);
              const place = osloPlace(grant.starttime);
              if (mondayOf(place.date) !== monday) setMonday(mondayOf(place.date));
              setSelectedId(grant.id);
            }}
            onPreview={setPreview}
            onSelectionChange={(changed) => {
              setSelection(changed);
              if (mondayOf(changed.date) !== monday) setMonday(mondayOf(changed.date));
            }}
          />
        ) : (
          <WeekSummary
            focus={focus}
            grants={grants}
            loading={grantsQuery.isLoading}
            now={now}
            onFocus={(id) => setFocus(id === focus ? null : id)}
          />
        )}
      </aside>
    </div>
  );
};

const formatTimeOf = (instant: string) => formatTime(osloPlace(instant).minute);

/** Airtime per organization this week, and what still needs work. */
const WeekSummary = ({
  grants,
  loading,
  now,
  focus,
  onFocus,
}: {
  grants: AirtimeGrant[];
  loading: boolean;
  now: number;
  focus: number | null;
  onFocus: (_id: number) => void;
}) => {
  const totals = new Map<number, { name: string; minutes: number }>();
  for (const grant of grants) {
    const minutes = windowMilliseconds(grant) / 60_000;
    const entry = totals.get(grant.organization.id) ?? {
      name: grant.organization.name,
      minutes: 0,
    };
    entry.minutes += minutes;
    totals.set(grant.organization.id, entry);
  }
  const rows = [...totals.entries()].sort((a, b) => b[1].minutes - a[1].minutes);
  const sum = rows.reduce((total, [, { minutes }]) => total + minutes, 0);
  const empty = grants.filter(
    (grant) => Date.parse(grant.endtime) > now && grant.items.length === 0,
  ).length;

  return (
    <section className="space-y-3 bg-background p-5">
      <h2 className="text-lg font-bold">Denne uken</h2>
      <p className="text-sm text-default-600">
        Velg en sendetid for å se og endre den. Dra eller trykk i en ledig del av uken for å gi
        sendetid eller sette opp en enkelt video.
      </p>
      {loading ? <p>Laster sendetid…</p> : null}
      {!loading && rows.length === 0 ? <p>Ingen sendetid er gitt denne uken.</p> : null}
      {empty > 0 ? (
        <p className="bg-warning/20 px-3 py-2 text-sm">
          {empty} {empty === 1 ? "sendetid har" : "sendetider har"} ingenting satt opp ennå.
        </p>
      ) : null}
      <ul className="space-y-1">
        {rows.map(([id, { name, minutes }]) => (
          <li key={id}>
            <button
              aria-pressed={focus === id}
              className={cx(
                "flex w-full items-center gap-2 px-2 py-1 text-left text-sm hover:bg-default-100",
                focus === id && "bg-default-200 font-semibold",
              )}
              type="button"
              onClick={() => onFocus(id)}
            >
              <span aria-hidden className="size-3 shrink-0" style={grantStyle(id)} />
              <span className="min-w-0 grow truncate">{name}</span>
              <span className="tabular-nums text-default-600">
                {formatLength(Math.round(minutes))}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {rows.length > 0 ? (
        <p className="border-t border-separator pt-2 text-sm font-semibold">
          Til sammen {formatLength(Math.round(sum))} av 168 t
        </p>
      ) : null}
    </section>
  );
};
