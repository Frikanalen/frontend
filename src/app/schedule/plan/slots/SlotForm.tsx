"use client";
import type {
  FillRuleSummary,
  Organization,
  PatchedRecurringSlotRequest,
  RecurringSlot,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { useFillRulesList } from "@/generated/fill-rules/fill-rules";
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
import { useState, type ReactNode } from "react";
import {
  DAY,
  MIN_DURATION,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  describeSlot,
  durationPayload,
  formatLength,
  formatTime,
  osloToday,
  parseTime,
  shapeOf,
} from "./slots";

/** A new slot being drawn: what the planner previews while the form is open. */
export type Draft = {
  organization: number | null;
  days: number[];
  start: number;
  duration: number;
};

/** "" is no choice yet; "station" is a slot that belongs to Frikanalen itself. */
type OwnerChoice = number | "" | "station";
/** "standard" leaves the rule to the server: the owner's newest uploads. */
type RuleChoice = number | "none" | "standard";

const POOL = { organization: "egne videoer", playlist: "spilleliste", filler: "fyllpool" };
const ORDERING = {
  latest: "nyeste først",
  least_aired: "minst sendt først",
  shuffled: "tilfeldig",
  weighted: "vektet",
};
const MODE = { one: "én video", fill: "fyll sendetiden" };

const ruleLabel = (rule: FillRuleSummary) =>
  `${rule.name} (${POOL[rule.pool]}, ${ORDERING[rule.ordering]}, ${MODE[rule.mode]})`;

const LIST_PARAMS = { limit: 1000 };
const fieldClass = "rounded-lg border border-default-300 bg-background px-3 py-2";

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
    {label}
    {children}
  </label>
);

/**
 * Everything about one slot: who has it, when and how often it airs, for
 * which dates, and how its airtime fills itself. Opens on a slot picked in
 * the planner, or on a stretch drawn on it.
 */
export const SlotForm = ({
  slot,
  draft,
  organizations,
  onClose,
  onSaved,
  onDraftChange,
}: {
  slot: RecurringSlot | null;
  draft: Draft | null;
  organizations: Organization[];
  onClose: () => void;
  onSaved: (_slot: RecurringSlot | null) => void;
  onDraftChange: (_draft: Draft) => void;
}) => {
  const queryClient = useQueryClient();
  const create = useRecurringSlotsCreate();
  const update = useRecurringSlotsPartialUpdate();
  const destroy = useRecurringSlotsDestroy();
  const initial = slot ? shapeOf(slot) : draft!;
  const [owner, setOwner] = useState<OwnerChoice>(
    slot ? (slot.organization ?? "station") : draft?.organization != null ? draft.organization : "",
  );
  const [days, setDays] = useState(initial.days);
  const [start, setStart] = useState(formatTime(initial.start));
  const [hours, setHours] = useState(Math.floor(initial.duration / 60));
  const [minutes, setMinutes] = useState(initial.duration % 60);
  const [interval, setInterval] = useState(slot?.interval ?? 1);
  const [startsOn, setStartsOn] = useState(slot?.startsOn ?? osloToday());
  const [endsOn, setEndsOn] = useState(slot?.endsOn ?? "");
  const [rule, setRule] = useState<RuleChoice>(
    slot ? (slot.defaultFillRule?.id ?? "none") : "standard",
  );
  const [error, setError] = useState<string>();

  const organizationId = typeof owner === "number" ? owner : null;
  const ownerChanged = slot ? (slot.organization ?? "station") !== owner : true;
  const rules = useFillRulesList(
    { organization: organizationId ?? undefined, limit: 100 },
    { query: { enabled: organizationId !== null } },
  );
  // A slot that repeats in ways the planner doesn't draw (monthly, daily)
  // keeps its pattern; only the shared fields are offered.
  const weekly = !slot || slot.frequency === "weekly";
  const duration = hours * 60 + minutes;
  const startMinutes = parseTime(start);

  const preview = (changes: Partial<Draft>) => {
    if (slot) return;
    onDraftChange({
      organization: organizationId,
      days,
      start: startMinutes,
      duration,
      ...changes,
    });
  };

  // Suspended members get no new airtime. A suspended member's existing slot
  // still lists its owner, so the form can show who has it.
  const offered = organizations.filter(
    (organization) => !organization.isRogue || organization.id === slot?.organization,
  );

  const toggleDay = (day: number) => {
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort((a, b) => a - b);
    setDays(next);
    preview({ days: next });
  };

  const invalid =
    owner === ""
      ? "Velg hvem som skal ha sendeflaten."
      : weekly && days.length === 0
        ? "Velg minst én ukedag."
        : duration < MIN_DURATION
          ? `Sendeflaten må vare minst ${MIN_DURATION} minutter.`
          : duration > DAY
            ? "En sendeflate kan vare høyst ett døgn."
            : endsOn && endsOn < startsOn
              ? "Sluttdatoen er før startdatoen."
              : null;

  const payload = (): PatchedRecurringSlotRequest => ({
    organization: organizationId,
    ...(weekly ? { frequency: "weekly" as const, interval, weekdays: days } : {}),
    startTime: start,
    duration: durationPayload(duration),
    startsOn,
    endsOn: endsOn || null,
    // Leaving the rule out gives a new owner the standard one; an unchanged
    // owner keeps theirs.
    ...(rule === "standard" ? {} : { defaultFillRuleId: rule === "none" ? null : rule }),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: getRecurringSlotsListQueryKey(LIST_PARAMS) });

  const submit = async () => {
    setError(undefined);
    try {
      const response = slot
        ? await update.mutateAsync({ id: slot.id, data: payload() })
        : await create.mutateAsync({
            data: {
              ...payload(),
              organization: organizationId,
              startTime: start,
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

  const ruleOptions = rules.data?.data.results ?? [];

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

      <Field label="Organisasjon">
        <select
          className={fieldClass}
          value={owner}
          onChange={(event) => {
            const value = event.target.value;
            const next: OwnerChoice =
              value === "" ? "" : value === "station" ? "station" : Number(value);
            setOwner(next);
            // Another owner can't use this one's rule.
            setRule("standard");
            preview({ organization: typeof next === "number" ? next : null });
          }}
        >
          <option disabled value="">
            Velg organisasjon
          </option>
          <option value="station">Frikanalen (kanalen selv)</option>
          {offered.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
              {organization.isRogue ? " (suspendert)" : ""}
            </option>
          ))}
        </select>
      </Field>

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

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Field label="Starter kl.">
          <input
            className={fieldClass}
            required
            step={300}
            type="time"
            value={start}
            onChange={(event) => {
              setStart(event.target.value);
              if (event.target.value) preview({ start: parseTime(event.target.value) });
            }}
          />
        </Field>
        <fieldset className="flex min-w-0 flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">Varighet</legend>
          <div className="flex items-center gap-1 text-sm">
            <input
              aria-label="Timer"
              className={cx(fieldClass, "w-16")}
              max={24}
              min={0}
              type="number"
              value={hours}
              onChange={(event) => {
                const value = Number(event.target.value);
                setHours(value);
                preview({ duration: value * 60 + minutes });
              }}
            />
            t
            <input
              aria-label="Minutter"
              className={cx(fieldClass, "w-16")}
              max={55}
              min={0}
              step={5}
              type="number"
              value={minutes}
              onChange={(event) => {
                const value = Number(event.target.value);
                setMinutes(value);
                preview({ duration: hours * 60 + value });
              }}
            />
            min
          </div>
        </fieldset>
      </div>
      <p className="-mt-2 text-sm text-default-600">
        {formatTime(startMinutes)}–{formatTime(startMinutes + duration)} · {formatLength(duration)}
      </p>

      {weekly ? (
        <Field label="Gjentas">
          <select
            className={fieldClass}
            value={interval}
            onChange={(event) => setInterval(Number(event.target.value))}
          >
            <option value={1}>Hver uke</option>
            <option value={2}>Annenhver uke</option>
            <option value={3}>Hver 3. uke</option>
            <option value={4}>Hver 4. uke</option>
          </select>
        </Field>
      ) : (
        <p className="text-sm text-default-600">Mønsteret endres i administrasjonen.</p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Field label="Fra dato">
          <input
            className={fieldClass}
            required
            type="date"
            value={startsOn}
            onChange={(event) => setStartsOn(event.target.value)}
          />
        </Field>
        <Field label="Til dato (valgfri)">
          <input
            className={fieldClass}
            min={startsOn}
            type="date"
            value={endsOn}
            onChange={(event) => setEndsOn(event.target.value)}
          />
        </Field>
      </div>
      {weekly && interval > 1 ? (
        <p className="-mt-2 text-sm text-default-600">Ukene telles fra uken til fra-datoen.</p>
      ) : null}

      {organizationId !== null ? (
        <Field label="Automatisk fylling">
          <select
            className={fieldClass}
            value={rule}
            onChange={(event) => {
              const value = event.target.value;
              setRule(value === "none" || value === "standard" ? value : Number(value));
            }}
          >
            {!slot || ownerChanged ? (
              <option value="standard">Organisasjonens nyeste videoer, fyll sendetiden</option>
            ) : null}
            {ruleOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {ruleLabel(option)}
              </option>
            ))}
            <option value="none">Ingen: sendetiden står tom til noen setter den opp</option>
          </select>
        </Field>
      ) : null}

      <p className="text-sm text-default-600">
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
