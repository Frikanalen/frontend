"use client";
import type {
  Organization,
  PatchedRecurringSlotRequest,
  RecurringSlot,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { useCategoriesList } from "@/generated/categories/categories";
import { useSeriesList } from "@/generated/series/series";
import {
  getRecurringSlotsListQueryKey,
  useRecurringSlotsCreate,
  useRecurringSlotsDestroy,
  useRecurringSlotsPartialUpdate,
} from "@/generated/recurring-slots/recurring-slots";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import cx from "classnames";
import { DayField } from "@/components/time/DayField";
import { TimeRange } from "@/components/time/TimeRange";
import { useState, type ReactNode } from "react";
import {
  DAY,
  MIN_DURATION,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  describeShape,
  describeSlot,
  durationPayload,
  formatTime,
  osloToday,
  sameShape,
  shapeOf,
  type Shape,
} from "./slots";
import { sameTheme, themeOf, themeProblem, type Theme } from "./theme";

/** Who a slot is for: a member, the video jukebox, or the station's own use. */
export type SlotKind = "member" | "jukebox" | "station";

/** The station's airtime that fills itself from the filler pool. */
export const isJukebox = (slot: Pick<RecurringSlot, "organization" | "recipe">) =>
  slot.organization == null && slot.recipe?.kind === "jukebox";

export const kindOf = (slot: Pick<RecurringSlot, "organization" | "recipe">): SlotKind =>
  slot.organization != null ? "member" : isJukebox(slot) ? "jukebox" : "station";

/** A new slot being drawn: what the planner previews while the form is open. */
export type Draft = Shape & {
  kind: SlotKind;
  organization: number | null;
};

/**
 * What a member's slot fills itself from: everything they upload, one of
 * their series (its id), nothing, or "kept" for a playlist staff set up in
 * the administration, which the form leaves as it is.
 */
type Source = number | "uploads" | "none" | "kept";

const sourceOf = (slot: RecurringSlot | null): Source => {
  if (!slot) return "uploads";
  const recipe = slot.recipe ?? null;
  if (recipe === null) return slot.organization == null ? "uploads" : "none";
  if (recipe.kind === "series" && recipe.series != null) return recipe.series;
  return recipe.kind === "playlist" ? "kept" : "uploads";
};

const KINDS: { value: SlotKind; label: string; hint: string }[] = [
  { value: "member", label: "Medlem", hint: "Fast sendetid for en organisasjon" },
  { value: "jukebox", label: "Videojukeboks", hint: "Fylles automatisk fra fyllstoffet" },
  { value: "station", label: "Frikanalen", hint: "Kanalens egen tid, settes opp for hånd" },
];

const LIST_PARAMS = { limit: 1000 };
const fieldClass = "rounded-lg border border-default-300 bg-background px-3 py-2";

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
    {label}
    {children}
  </label>
);

/** A whole number of at least one, or no limit while the field is empty. */
const LimitField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (_value: number | null) => void;
}) => (
  <Field label={label}>
    <input
      className={fieldClass}
      inputMode="numeric"
      min={1}
      placeholder="Ingen grense"
      type="number"
      value={value ?? ""}
      onChange={(event) => {
        const number = Math.floor(Number(event.target.value));
        onChange(event.target.value === "" || !(number >= 1) ? null : number);
      }}
    />
  </Field>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3 border-t border-separator pt-4">
    <h3 className="text-xs font-semibold tracking-wide text-default-600 uppercase">{title}</h3>
    {children}
  </section>
);

/**
 * Everything about one slot: who it is for, when and how often it airs, for
 * which dates, and how its airtime fills itself. Opens on a slot picked in
 * the planner, or on a stretch drawn on it. The days and times are the
 * planner's `shape`, so a drag on the week and the fields here stay in step;
 * nothing is saved until the form is.
 */
export const SlotForm = ({
  slot,
  draft,
  shape,
  organizations,
  onClose,
  onSaved,
  onShapeChange,
}: {
  slot: RecurringSlot | null;
  draft: Draft | null;
  shape: Shape;
  organizations: Organization[];
  onClose: () => void;
  onSaved: (_slot: RecurringSlot | null) => void;
  onShapeChange: (_shape: Shape) => void;
}) => {
  const queryClient = useQueryClient();
  const create = useRecurringSlotsCreate();
  const update = useRecurringSlotsPartialUpdate();
  const destroy = useRecurringSlotsDestroy();
  const savedKind = slot ? kindOf(slot) : null;
  const [kind, setKind] = useState<SlotKind>(savedKind ?? draft?.kind ?? "member");
  const [organization, setOrganization] = useState<number | "">(
    slot?.organization ?? draft?.organization ?? "",
  );
  const [interval, setInterval] = useState(slot?.interval ?? 1);
  const [startsOn, setStartsOn] = useState(slot?.startsOn ?? osloToday());
  const [endsOn, setEndsOn] = useState(slot?.endsOn ?? "");
  const [source, setSource] = useState<Source>(() => sourceOf(slot));
  const savedTheme = themeOf(slot?.recipe);
  const [theme, setTheme] = useState<Theme>(savedTheme);
  const [error, setError] = useState<string>();

  const { days, start, duration } = shape;
  const organizationId = kind === "member" && organization !== "" ? organization : null;
  const series = useSeriesList(
    { organization: organizationId ?? undefined, limit: 200 },
    { query: { enabled: organizationId !== null } },
  );
  const categories = useCategoriesList(undefined, { query: { enabled: kind === "jukebox" } });
  // A slot that repeats in ways the planner doesn't draw (monthly, daily)
  // keeps its pattern; only the shared fields are offered.
  const weekly = !slot || slot.frequency === "weekly";
  const saved = slot ? shapeOf(slot) : null;
  const moved = saved !== null && !sameShape(saved, shape);

  // Suspended members get no new airtime. A suspended member's existing slot
  // still lists its owner, so the form can show who has it.
  const offered = organizations.filter(
    (candidate) => !candidate.isRogue || candidate.id === slot?.organization,
  );

  const toggleDay = (day: number) =>
    onShapeChange({
      ...shape,
      days: days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day].sort((a, b) => a - b),
    });

  const invalid =
    kind === "member" && organization === ""
      ? "Velg hvilken organisasjon som skal ha sendeflaten."
      : weekly && days.length === 0
        ? "Velg minst én ukedag."
        : duration < MIN_DURATION
          ? `Sendeflaten må vare minst ${MIN_DURATION} minutter.`
          : duration > DAY
            ? "En sendeflate kan vare høyst ett døgn."
            : endsOn && endsOn < startsOn
              ? "Sluttdatoen er før startdatoen."
              : kind === "jukebox"
                ? themeProblem(theme)
                : null;

  const payload = (): PatchedRecurringSlotRequest => ({
    organization: organizationId,
    ...(weekly
      ? { frequency: "weekly" as const, interval, weekdays: days }
      : // A daily slot with no weekdays stays that way unless a day moved.
        saved && saved.days.join() !== days.join()
        ? { weekdays: days }
        : {}),
    startTime: formatTime(start),
    duration: durationPayload(duration),
    startsOn,
    endsOn: endsOn || null,
    ...(kind === "jukebox"
      ? // A theme is stored anew when it changes, so an untouched one isn't sent.
        savedKind === "jukebox" && sameTheme(theme, savedTheme)
        ? {}
        : {
            recipe: {
              kind: "jukebox" as const,
              name: theme.name.trim(),
              categories: theme.categories,
              shortest: theme.shortest === null ? null : durationPayload(theme.shortest),
              longest: theme.longest === null ? null : durationPayload(theme.longest),
              newerThanDays: theme.newerThanDays,
              olderThanDays: theme.olderThanDays,
            },
          }
      : kind === "station"
        ? // The station's own time is set up by hand.
          { recipe: null }
        : source === "kept"
          ? {}
          : {
              recipe:
                source === "none"
                  ? null
                  : source === "uploads"
                    ? { kind: "uploads" as const }
                    : { kind: "series" as const, series: source },
            }),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: getRecurringSlotsListQueryKey(LIST_PARAMS) });

  const submit = async () => {
    setError(undefined);
    try {
      const data = payload();
      const response = slot
        ? await update.mutateAsync({ id: slot.id, data })
        : await create.mutateAsync({
            data: {
              ...data,
              organization: organizationId,
              startTime: formatTime(start),
              duration: durationPayload(duration),
              startsOn,
            },
          });
      await refresh();
      onSaved(response.data);
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const remove = async () => {
    if (!slot) return;
    if (
      !globalThis.confirm(
        "Slette sendeflaten? Sendetid den allerede har delt ut, blir stående. Vil du heller at den slutter fra en dato, sett en sluttdato i stedet.",
      )
    ) {
      return;
    }
    setError(undefined);
    try {
      await destroy.mutateAsync({ id: slot.id });
      await refresh();
      onSaved(null);
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const seriesOptions = series.data?.data.results ?? [];
  const categoryOptions = categories.data?.data.results ?? [];
  const toggleCategory = (id: number) =>
    setTheme({
      ...theme,
      categories: theme.categories.includes(id)
        ? theme.categories.filter((category) => category !== id)
        : [...theme.categories, id].sort((a, b) => a - b),
    });

  return (
    <form
      aria-labelledby="slot-form-heading"
      className="space-y-4 bg-background p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <header>
        <h2 className="text-lg font-bold" id="slot-form-heading">
          {slot ? "Endre sendeflate" : "Ny sendeflate"}
        </h2>
        {slot ? <p className="text-sm text-default-600">{describeSlot(slot)}</p> : null}
      </header>

      {moved ? (
        <div className="border-l-4 border-warning bg-warning/10 p-3 text-sm" role="status">
          <p className="font-semibold">Flyttet, men ikke lagret</p>
          <p>
            Nå: {describeShape(shape)}.{" "}
            <button
              className="font-semibold text-link hover:underline"
              type="button"
              onClick={() => onShapeChange(saved)}
            >
              Sett tilbake
            </button>
          </p>
        </div>
      ) : null}

      <Section title="Hvem">
        <fieldset className="space-y-1">
          <legend className="sr-only">Hvem sendeflaten er for</legend>
          {KINDS.map(({ value, label, hint }) => (
            <label
              className={cx(
                "flex cursor-pointer flex-col border px-3 py-1.5 text-sm",
                kind === value ? "border-accent bg-accent/10" : "border-default-300",
              )}
              key={value}
            >
              <input
                checked={kind === value}
                className="sr-only"
                name="slot-kind"
                type="radio"
                value={value}
                onChange={() => setKind(value)}
              />
              <span className="font-semibold">{label}</span>
              <span className="text-default-600">{hint}</span>
            </label>
          ))}
        </fieldset>

        {kind === "member" ? (
          <Field label="Organisasjon">
            <select
              className={fieldClass}
              value={organization}
              onChange={(event) => {
                setOrganization(event.target.value === "" ? "" : Number(event.target.value));
                // Another owner can't use this one's series or playlist.
                setSource("uploads");
              }}
            >
              <option disabled value="">
                Velg organisasjon
              </option>
              {offered.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                  {candidate.isRogue ? " (suspendert)" : ""}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <p className="text-sm text-default-600">
            {kind === "jukebox"
              ? "Jukeboksen trekker videoer som er merket som fyllstoff, og fyller hele sendeflaten. Ingen trenger å sette opp noe. Med et tema under trekker den bare det som passer."
              : "Sendetiden står tom til noen i Frikanalen setter den opp."}
          </p>
        )}
      </Section>

      <Section title="Når">
        {weekly ? (
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Ukedager</legend>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS_SHORT.map((label, day) => (
                <label
                  className={cx(
                    "flex cursor-pointer justify-center border py-1.5 text-sm font-semibold",
                    days.includes(day)
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-default-300",
                  )}
                  key={label}
                  title={WEEKDAYS[day]}
                >
                  <input
                    aria-label={WEEKDAYS[day]}
                    checked={days.includes(day)}
                    className="sr-only"
                    type="checkbox"
                    onChange={() => toggleDay(day)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <TimeRange
          duration={duration}
          start={start}
          onChange={(range) => onShapeChange({ ...shape, ...range })}
        />

        {weekly ? (
          <Field label="Gjentas">
            <select
              className={fieldClass}
              value={interval}
              onChange={(event) => setInterval(Number(event.target.value))}
            >
              <option value={1}>Ukentlig</option>
              <option value={2}>Annenhver uke</option>
              <option value={3}>Hver 3. uke</option>
              <option value={4}>Hver 4. uke</option>
            </select>
          </Field>
        ) : (
          <p className="text-sm text-default-600">Mønsteret endres i administrasjonen.</p>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <DayField isRequired label="Fra dato" value={startsOn} onChange={setStartsOn} />
          <DayField
            label="Til dato (valgfri)"
            min={startsOn || undefined}
            value={endsOn}
            onChange={setEndsOn}
          />
        </div>
        {weekly && interval > 1 ? (
          <p className="text-sm text-default-600">Ukene telles fra uken til fra-datoen.</p>
        ) : null}
      </Section>

      {organizationId !== null ? (
        <Section title="Innhold">
          <Field label="Fylles fra">
            <select
              className={fieldClass}
              value={source}
              onChange={(event) => {
                const value = event.target.value;
                setSource(
                  value === "uploads" || value === "none" || value === "kept"
                    ? value
                    : Number(value),
                );
              }}
            >
              <option value="uploads">Alt organisasjonen laster opp</option>
              {seriesOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  Serien «{option.name}»
                </option>
              ))}
              {/* A series in use stays on offer while the list loads. */}
              {typeof source === "number" && !seriesOptions.some(({ id }) => id === source) ? (
                <option value={source}>Serien «{slot?.recipe?.seriesName ?? "…"}»</option>
              ) : null}
              {sourceOf(slot) === "kept" && slot?.organization === organizationId ? (
                <option value="kept">Spilleliste satt opp i administrasjonen</option>
              ) : null}
              <option value="none">Ingenting: sendetiden står tom til noen setter den opp</option>
            </select>
          </Field>
          {source !== "none" && source !== "kept" ? (
            <p className="text-sm text-default-600">
              Det nyeste som ikke er sendt kommer først, så fylles tiden fra arkivet. Organisasjonen
              kan selv velge noe annet for hver sending.
            </p>
          ) : null}
        </Section>
      ) : null}

      {kind === "jukebox" ? (
        <Section title="Tema">
          <p className="text-sm text-default-600">
            Valgfritt. Uten noe her trekker jukeboksen fra alt fyllstoffet.
          </p>
          <Field label="Navn">
            <input
              className={fieldClass}
              maxLength={100}
              placeholder="For eksempel Kulturnatt"
              value={theme.name}
              onChange={(event) => setTheme({ ...theme, name: event.target.value })}
            />
          </Field>
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Kategorier</legend>
            <div className="flex flex-wrap gap-1">
              {categoryOptions.map((category) => (
                <label
                  className={cx(
                    "cursor-pointer border px-2 py-1 text-sm",
                    theme.categories.includes(category.id)
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-default-300",
                  )}
                  key={category.id}
                >
                  <input
                    checked={theme.categories.includes(category.id)}
                    className="sr-only"
                    type="checkbox"
                    onChange={() => toggleCategory(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
            <p className="text-sm text-default-600">
              {theme.categories.length === 0
                ? "Ingen valgt: alle kategorier er med."
                : "Bare videoer i de valgte kategoriene."}
            </p>
          </fieldset>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <LimitField
              label="Korteste video (minutter)"
              value={theme.shortest}
              onChange={(shortest) => setTheme({ ...theme, shortest })}
            />
            <LimitField
              label="Lengste video (minutter)"
              value={theme.longest}
              onChange={(longest) => setTheme({ ...theme, longest })}
            />
            <LimitField
              label="Nyere enn (dager)"
              value={theme.newerThanDays}
              onChange={(newerThanDays) => setTheme({ ...theme, newerThanDays })}
            />
            <LimitField
              label="Eldre enn (dager)"
              value={theme.olderThanDays}
              onChange={(olderThanDays) => setTheme({ ...theme, olderThanDays })}
            />
          </div>
        </Section>
      ) : null}

      <p className="border-t border-separator pt-4 text-sm text-default-600">
        Sendetid deles ut to uker frem. Endringer gjelder sendetid som deles ut etter at du lagrer;
        det som alt er delt ut, blir som det er.
      </p>

      {invalid || error ? (
        <p className={cx("text-sm", error && "font-medium text-danger-700")} role="alert">
          {error ?? invalid}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          isDisabled={!!invalid}
          isPending={create.isPending || update.isPending}
          type="submit"
          variant="primary"
        >
          {slot ? "Lagre" : "Opprett"}
        </Button>
        <Button variant="tertiary" onPress={onClose}>
          Avbryt
        </Button>
        {slot ? (
          <Button
            className="ms-auto"
            isPending={destroy.isPending}
            variant="danger"
            onPress={() => void remove()}
          >
            Slett
          </Button>
        ) : null}
      </div>
    </form>
  );
};
