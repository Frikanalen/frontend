"use client";
import type { Organization, RecurringSlot } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  getRecurringSlotsListQueryKey,
  useRecurringSlotsList,
  useRecurringSlotsPartialUpdate,
} from "@/generated/recurring-slots/recurring-slots";
import { formatApiError } from "@/lib/formatApiError";
import { useQueryClient } from "@tanstack/react-query";
import cx from "classnames";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { GoAlert } from "react-icons/go";
import { SlotForm, type Draft } from "./SlotForm";
import {
  DAY,
  MIN_DURATION,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  blocksOf,
  clamp,
  durationPayload,
  formatLength,
  formatTime,
  isCurrent,
  moveDay,
  organizationHue,
  osloToday,
  recurrenceLabel,
  shapeOf,
  slotsMayCollide,
  snap,
  type Shape,
} from "./slots";

const HOUR_PX = 40;
const PX_PER_MINUTE = HOUR_PX / 60;
/** Pointer travel below this is a click, not a drag. */
const DRAG_THRESHOLD = 4;
const LIST_PARAMS = { limit: 1000 };
/** What "Fremhev" holds for the station's own slots, which have no organization. */
const STATION = 0;
const focusKey = (slot: Pick<RecurringSlot, "organization">) => slot.organization ?? STATION;

type Drag =
  | { kind: "create"; day: number; anchor: number; current: number }
  | {
      kind: "move" | "resize";
      slot: RecurringSlot;
      pickDay: number;
      /** Minutes between the occurrence's start and where it was grabbed. */
      grab: number;
      x: number;
      y: number;
      moved: boolean;
      shape: Shape;
    };

/** An organization's colour; the station's own slots are a neutral grey. */
const blockStyle = (slot: Pick<RecurringSlot, "organization">) => {
  const hue = organizationHue(slot.organization);
  return { backgroundColor: hue === null ? "oklch(0.45 0 0)" : `oklch(0.48 0.1 ${hue})` };
};

/**
 * The week as Frikanalen's regular programming sees it: one column per
 * weekday, every recurring slot drawn where it airs. Staff drag on an empty
 * stretch to give an organization a new slot, drag a slot to move it, and
 * drag its lower edge to change its length. Everything else is in the form
 * beside the grid, which is also the keyboard way to do all of the above.
 */
export const SlotPlanner = ({ organizations }: { organizations: Organization[] }) => {
  const queryClient = useQueryClient();
  const slots = useRecurringSlotsList(LIST_PARAMS);
  const update = useRecurringSlotsPartialUpdate();
  const [today] = useState(() => osloToday());
  const [showEnded, setShowEnded] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  // Shapes saved but not yet confirmed, so a dropped slot stays put meanwhile.
  const [pending, setPending] = useState<Record<number, Shape>>({});
  const [error, setError] = useState<string>();
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Open on the morning rather than at midnight, when little airs.
    scrollRef.current?.scrollTo({ top: 6 * HOUR_PX - 8 });
  }, []);

  const byId = useMemo(
    () => new Map(organizations.map((organization) => [organization.id, organization])),
    [organizations],
  );
  const suspended = (slot: RecurringSlot) =>
    slot.organization != null && !!byId.get(slot.organization)?.isRogue;

  const all = useMemo(() => slots.data?.data.results ?? [], [slots.data]);
  const visible = all.filter((slot) => showEnded || isCurrent(slot, today));
  const shapeFor = (slot: RecurringSlot): Shape =>
    drag && drag.kind !== "create" && drag.slot.id === slot.id
      ? drag.shape
      : (pending[slot.id] ?? shapeOf(slot));

  // Slots that issue airtime and could be on air at the same time. The server
  // refuses new collisions; these are the ones already there, or a drag
  // that is about to make one.
  const live = visible.filter((slot) => isCurrent(slot, today) && !suspended(slot));
  const colliding = new Set<number>();
  live.forEach((a, i) =>
    live.slice(i + 1).forEach((b) => {
      if (slotsMayCollide(a, shapeFor(a), b, shapeFor(b))) {
        colliding.add(a.id);
        colliding.add(b.id);
      }
    }),
  );

  const point = (event: PointerEvent) => {
    const rect = bodyRef.current!.getBoundingClientRect();
    return {
      minute: clamp((event.clientY - rect.top) / PX_PER_MINUTE, 0, DAY),
      day: clamp(Math.floor(((event.clientX - rect.left) / rect.width) * 7), 0, 6),
    };
  };

  const startCreate = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const { minute, day } = point(event);
    const anchor = snap(minute, 15);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ kind: "create", day, anchor, current: anchor });
  };

  const startSlotDrag = (
    event: PointerEvent<HTMLElement>,
    slot: RecurringSlot,
    kind: "move" | "resize",
    pickDay: number,
  ) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const shape = shapeFor(slot);
    const { minute } = point(event);
    bodyRef.current!.setPointerCapture(event.pointerId);
    setDrag({
      kind,
      slot,
      pickDay,
      grab: minute - shape.start,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      shape,
    });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const { minute, day } = point(event);
    if (drag.kind === "create") {
      setDrag({ ...drag, current: snap(minute, 15) });
      return;
    }
    const moved =
      drag.moved || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > DRAG_THRESHOLD;
    if (!moved) return;
    const original = pending[drag.slot.id] ?? shapeOf(drag.slot);
    if (drag.kind === "resize") {
      const end = snap(minute);
      const duration = Math.max(MIN_DURATION, end - original.start);
      setDrag({ ...drag, moved, shape: { ...original, duration } });
      return;
    }
    const start = clamp(snap(minute - drag.grab), 0, DAY - 1);
    const days = moveDay(original.days, drag.pickDay, day) ?? original.days;
    setDrag({ ...drag, moved, shape: { ...original, start, days } });
  };

  const onPointerUp = () => {
    if (!drag) return;
    setDrag(null);
    if (drag.kind === "create") {
      const from = Math.min(drag.anchor, drag.current);
      const to = Math.max(drag.anchor, drag.current);
      setSelected(null);
      setDraft({
        organization: focus === STATION ? null : focus,
        days: [drag.day],
        start: from,
        // A click rather than a drag asks for the common case: an hour.
        duration: to - from >= 15 ? to - from : 60,
      });
      return;
    }
    if (!drag.moved) {
      setDraft(null);
      setSelected(drag.slot.id);
      return;
    }
    void save(drag.slot, drag.shape);
  };

  const save = async (slot: RecurringSlot, shape: Shape) => {
    const before = pending[slot.id] ?? shapeOf(slot);
    if (
      shape.start === before.start &&
      shape.duration === before.duration &&
      shape.days.join() === before.days.join()
    ) {
      return;
    }
    setError(undefined);
    setPending((current) => ({ ...current, [slot.id]: shape }));
    try {
      await update.mutateAsync({
        id: slot.id,
        data: {
          startTime: formatTime(shape.start),
          duration: durationPayload(shape.duration),
          // A daily slot with no weekdays stays that way unless a day moved.
          ...(shape.days.join() !== before.days.join() ? { weekdays: shape.days } : {}),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getRecurringSlotsListQueryKey(LIST_PARAMS) });
    } catch (caught) {
      setError(`Kunne ikke flytte sendeflaten: ${formatApiError(caught)}`);
    } finally {
      setPending((current) => {
        const rest = { ...current };
        delete rest[slot.id];
        return rest;
      });
    }
  };

  const selectedSlot = all.find((slot) => slot.id === selected) ?? null;
  const createPreview =
    drag?.kind === "create"
      ? {
          day: drag.day,
          top: Math.min(drag.anchor, drag.current),
          bottom: Math.max(drag.anchor, drag.current, Math.min(drag.anchor, drag.current) + 15),
        }
      : null;
  const draftBlocks = draft
    ? blocksOf({ days: draft.days, start: draft.start, duration: draft.duration })
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            Fremhev
            <select
              className="rounded-lg border border-default-300 bg-background px-2 py-1"
              value={focus ?? ""}
              onChange={(event) => setFocus(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Alle organisasjoner</option>
              {all.some((slot) => slot.organization == null) ? (
                <option value={STATION}>Frikanalen</option>
              ) : null}
              {organizations
                .filter((organization) => all.some((slot) => slot.organization === organization.id))
                .map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              checked={showEnded}
              type="checkbox"
              onChange={(event) => setShowEnded(event.target.checked)}
            />
            Vis avsluttede
          </label>
          <p className="text-sm text-default-600">
            Dra i en ledig del av uken for å lage en ny sendeflate.
          </p>
        </div>

        {slots.isError ? <p role="alert">{formatApiError(slots.error)}</p> : null}
        {error ? (
          <p className="bg-danger/10 px-3 py-2 text-sm font-medium text-danger-700" role="alert">
            {error}
          </p>
        ) : null}
        {colliding.size > 0 ? (
          <p className="flex items-center gap-2 bg-warning/20 px-3 py-2 text-sm">
            <GoAlert aria-hidden className="shrink-0" />
            {colliding.size} sendeflater kan overlappe. Når to overlapper, får bare den ene
            sendetid.
          </p>
        ) : null}

        <div className="overflow-x-auto bg-background">
          <div className="min-w-[44rem]">
            <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-separator text-sm font-semibold">
              <span />
              {WEEKDAYS.map((day, index) => (
                <span className="px-2 py-2" key={day}>
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{WEEKDAYS_SHORT[index]}</span>
                </span>
              ))}
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
                    // Fingers scroll the week; a tap still picks or creates a slot.
                    "relative touch-pan-x touch-pan-y select-none",
                    drag?.kind === "create" ? "cursor-ns-resize" : "cursor-crosshair",
                  )}
                  data-testid="slot-grid"
                  ref={bodyRef}
                  style={{
                    height: 24 * HOUR_PX,
                    backgroundImage: `linear-gradient(to bottom, var(--separator) 1px, transparent 1px)`,
                    backgroundSize: `100% ${HOUR_PX}px`,
                  }}
                  onPointerCancel={() => setDrag(null)}
                  onPointerDown={startCreate}
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

                  {visible.map((slot) => {
                    const shape = shapeFor(slot);
                    const dragging = drag && drag.kind !== "create" && drag.slot.id === slot.id;
                    const ended = !isCurrent(slot, today);
                    const isSuspended = suspended(slot);
                    const dimmed =
                      (focus !== null && focusKey(slot) !== focus) || ended || isSuspended;
                    const name = slot.organizationName ?? "Frikanalen";
                    const pattern = recurrenceLabel(slot);
                    const lastBlock = (day: number) =>
                      blocksOf({ ...shape, days: [day] }).at(-1)!.bottom;
                    return blocksOf(shape).map((block) => (
                      <button
                        aria-label={`${name}, ${WEEKDAYS[block.day]} ${formatTime(shape.start)}–${formatTime(shape.start + shape.duration)}`}
                        aria-pressed={selected === slot.id}
                        className={cx(
                          "absolute flex flex-col overflow-hidden px-1.5 py-0.5 text-left text-xs leading-tight text-white",
                          block.continued ? "cursor-default" : "cursor-grab",
                          dragging && "z-20 cursor-grabbing shadow-lg ring-2 ring-white/70",
                          selected === slot.id && "z-10 ring-2 ring-foreground ring-offset-1",
                          colliding.has(slot.id) && "outline-2 outline-danger",
                          dimmed && !dragging && "opacity-35",
                          (pattern || isSuspended) &&
                            "bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgb(255_255_255/0.14)_6px_12px)]",
                        )}
                        data-slot-id={slot.id}
                        key={`${slot.id}-${block.day}-${block.column}`}
                        style={{
                          ...blockStyle(slot),
                          top: block.top * PX_PER_MINUTE,
                          height: Math.max((block.bottom - block.top) * PX_PER_MINUTE - 1, 6),
                          left: `calc(${(block.column / 7) * 100}% + 2px)`,
                          width: `calc(${100 / 7}% - 4px)`,
                        }}
                        type="button"
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setDraft(null);
                            setSelected(slot.id);
                          }
                        }}
                        onPointerDown={(event) =>
                          block.continued
                            ? event.stopPropagation()
                            : startSlotDrag(event, slot, "move", block.day)
                        }
                      >
                        {block.bottom - block.top < 45 ? (
                          <span className="truncate">
                            <span className="font-semibold">{name}</span> {formatTime(shape.start)}
                          </span>
                        ) : (
                          <>
                            <span className="truncate font-semibold">{name}</span>
                            <span className="truncate opacity-90">
                              {formatTime(shape.start)}–{formatTime(shape.start + shape.duration)}
                              {isSuspended ? " · suspendert" : pattern ? ` · ${pattern}` : ""}
                            </span>
                          </>
                        )}
                        {block.bottom === lastBlock(block.day) && !isSuspended ? (
                          <span
                            aria-hidden
                            className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
                            onPointerDown={(event) =>
                              startSlotDrag(event, slot, "resize", block.day)
                            }
                          />
                        ) : null}
                      </button>
                    ));
                  })}

                  {createPreview ? (
                    <div
                      className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/15 px-1.5 text-xs font-semibold"
                      style={{
                        top: createPreview.top * PX_PER_MINUTE,
                        height: (createPreview.bottom - createPreview.top) * PX_PER_MINUTE,
                        left: `calc(${(createPreview.day / 7) * 100}% + 2px)`,
                        width: `calc(${100 / 7}% - 4px)`,
                      }}
                    >
                      {formatTime(createPreview.top)}–{formatTime(createPreview.bottom)}
                    </div>
                  ) : null}
                  {draftBlocks.map((block) => (
                    <div
                      className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/25 px-1.5 text-xs font-semibold"
                      key={`draft-${block.day}-${block.column}`}
                      style={{
                        top: block.top * PX_PER_MINUTE,
                        height: (block.bottom - block.top) * PX_PER_MINUTE,
                        left: `calc(${(block.column / 7) * 100}% + 2px)`,
                        width: `calc(${100 / 7}% - 4px)`,
                      }}
                    >
                      Ny
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        {draft || selectedSlot ? (
          <SlotForm
            key={selectedSlot ? `slot-${selectedSlot.id}` : "new"}
            draft={draft}
            organizations={organizations}
            slot={selectedSlot}
            onClose={() => {
              setDraft(null);
              setSelected(null);
            }}
            onDraftChange={setDraft}
            onSaved={(saved) => {
              setDraft(null);
              setSelected(saved?.id ?? null);
            }}
          />
        ) : (
          <Totals
            focus={focus}
            organizations={byId}
            slots={live}
            onFocus={(id) => setFocus(id === focus ? null : id)}
          />
        )}
      </aside>
    </div>
  );
};

/** Weekly airtime per organization, the number an allocation is about. */
const Totals = ({
  slots,
  organizations,
  focus,
  onFocus,
}: {
  slots: RecurringSlot[];
  organizations: Map<number, Organization>;
  focus: number | null;
  onFocus: (_id: number) => void;
}) => {
  const totals = new Map<number, number>();
  for (const slot of slots) {
    const shape = shapeOf(slot);
    // Averaged over the pattern: every other week counts half.
    const perWeek =
      slot.frequency === "monthly"
        ? (shape.days.length * (slot.monthWeeks?.length ?? 1) * shape.duration * 12) /
          52 /
          (slot.interval ?? 1)
        : (shape.days.length * shape.duration) / (slot.interval ?? 1);
    totals.set(focusKey(slot), (totals.get(focusKey(slot)) ?? 0) + perWeek);
  }
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const sum = rows.reduce((total, [, minutes]) => total + minutes, 0);

  return (
    <section className="space-y-3 bg-background p-5">
      <h2 className="text-lg font-bold">Faste sendeflater per uke</h2>
      <p className="text-sm text-default-600">
        Velg en sendeflate for å endre den, eller dra i en ledig del av uken for å lage en ny.
      </p>
      <ul className="space-y-1">
        {rows.map(([id, minutes]) => (
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
              <span
                aria-hidden
                className="size-3 shrink-0"
                style={blockStyle({ organization: id === STATION ? null : id })}
              />
              <span className="min-w-0 grow truncate">
                {id === STATION ? "Frikanalen" : (organizations.get(id)?.name ?? `#${id}`)}
              </span>
              <span className="tabular-nums text-default-600">
                {formatLength(Math.round(minutes))}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="border-t border-separator pt-2 text-sm font-semibold">
        Til sammen {formatLength(Math.round(sum))} av 168 t
      </p>
    </section>
  );
};
