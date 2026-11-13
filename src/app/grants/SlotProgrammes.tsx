"use client";
import {
  formatTime,
  parseDuration,
  parseTime,
  recurrenceLabel,
  slotDays,
  WEEKDAYS,
} from "@/app/schedule/plan/slots/slots";
import type { RecurringSlot } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  getRecurringSlotsListQueryKey,
  useRecurringSlotsList,
  useRecurringSlotsSeriesUpdate,
} from "@/generated/recurring-slots/recurring-slots";
import { useSeriesList } from "@/generated/series/series";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

const EVERYTHING = "";

/** "Torsdag 19:00–20:00", with the rarer recurrences spelled out. */
export const slotLabel = (slot: RecurringSlot) => {
  const days = slotDays(slot);
  const start = parseTime(slot.startTime);
  const end = (start + parseDuration(slot.duration)) % (24 * 60);
  const when = days.length === 7 ? "Hver dag" : days.map((day) => WEEKDAYS[day]).join(", ");
  const recurrence = recurrenceLabel(slot);
  return `${when} ${formatTime(start)}–${formatTime(end)}${recurrence ? `, ${recurrence}` : ""}`;
};

/**
 * The organization's fixed slots, and what each one fills itself from: one
 * of their series, or everything they upload. A slot does this on its own
 * every week; the choice here is all a member has to make.
 */
export const SlotProgrammes = ({ organizationId }: { organizationId: number }) => {
  const slots = useRecurringSlotsList({ limit: 500 });
  const series = useSeriesList({ organization: organizationId, limit: 200 });
  const mine = (slots.data?.data.results ?? []).filter(
    (slot) => slot.organization === organizationId,
  );
  if (!slots.isSuccess || mine.length === 0) return null;
  const choices = series.data?.data.results ?? [];

  return (
    <section aria-labelledby="slot-programmes" className="space-y-3 bg-background p-5">
      <h2 className="text-xl font-bold" id="slot-programmes">
        Faste sendeflater
      </h2>
      <p className="max-w-3xl text-sm text-default-600">
        En fast sendeflate fyller seg selv: først det nyeste som ikke har vært sendt, deretter
        arkivet, det som er sendt minst først. Velg en serie for å la sendeflaten følge den. Nye
        opplastinger kommer med helt frem til et døgn før sending.
      </p>
      <ul className="divide-y divide-default-200 border-t border-foreground">
        {mine.map((slot) => (
          <SlotRow key={slot.id} choices={choices} slot={slot} />
        ))}
      </ul>
      {series.isSuccess && choices.length === 0 ? (
        <p className="text-sm text-default-600">
          Dere har ingen serier ennå.{" "}
          <Link
            className="font-semibold text-link hover:underline"
            href={`/organization/${organizationId}/series`}
          >
            Opprett en serie
          </Link>{" "}
          for å la en sendeflate følge den.
        </p>
      ) : null}
    </section>
  );
};

const SlotRow = ({
  slot,
  choices,
}: {
  slot: RecurringSlot;
  choices: { id: number; name: string }[];
}) => {
  const current = slot.defaultFillRule?.series ? String(slot.defaultFillRule.series) : EVERYTHING;
  const [chosen, setChosen] = useState(current);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();
  const update = useRecurringSlotsSeriesUpdate();
  const dirty = chosen !== current;

  const save = async () => {
    setError(undefined);
    try {
      await update.mutateAsync({
        id: slot.id,
        data: { series: chosen === EVERYTHING ? null : Number(chosen) },
      });
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: getRecurringSlotsListQueryKey() });
      // The grants the slot already issued follow the new choice.
      await queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <span className="min-w-48 grow font-semibold">{slotLabel(slot)}</span>
      <label className="flex items-center gap-2 text-sm">
        Fylles fra
        <select
          className="max-w-64 rounded-lg border border-default-300 bg-background px-3 py-2"
          value={chosen}
          onChange={(event) => {
            setChosen(event.target.value);
            setSaved(false);
            setError(undefined);
          }}
        >
          <option value={EVERYTHING}>Alt vi laster opp</option>
          {choices.map((option) => (
            <option key={option.id} value={option.id}>
              Serien «{option.name}»
            </option>
          ))}
        </select>
      </label>
      <Button isDisabled={!dirty} isPending={update.isPending} size="sm" onPress={save}>
        Lagre
      </Button>
      {saved && !dirty ? (
        <span className="text-sm text-success-700" role="status">
          Lagret
        </span>
      ) : null}
      {error ? (
        <p className="w-full text-sm text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
};
