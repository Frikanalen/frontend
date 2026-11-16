"use client";
import { osloInstant } from "@/app/requests/dates";
import { addDays, osloPlace } from "@/app/schedule/plan/week/week";
import type { AirtimeGrant } from "@/generated/frikanalenDjangoAPI.schemas";
import { grantsRetrieve, useGrantsPartialUpdate } from "@/generated/grants/grants";
import { formatApiError } from "@/lib/formatApiError";
import { formatOsloTime } from "@/lib/osloTime";
import { Button as HeroButton } from "@heroui/react";
import { useState } from "react";
import { clock, CLOSE_CALL_MILLISECONDS, cutWarning, OnAirConfirm, timeNow } from "./OnAirConfirm";

/**
 * The end a staff member types, as an instant: on the grant's start date in
 * Oslo, or the day after for a time at or before the start (past midnight).
 */
export const endFromTime = (grant: Pick<AirtimeGrant, "starttime">, time: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return undefined;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  const start = osloPlace(grant.starttime);
  const date = minutes <= start.minute ? addDays(start.date, 1) : start.date;
  return osloInstant(date, minutes);
};

/** Staff move the end of a grant, also while it is on air, e.g. to make room after it. */
export const GrantEndControl = ({
  grant,
  dirty,
  onAir,
  onSaved,
}: {
  grant: AirtimeGrant;
  /** The programme on air in this grant, and when it ends. */
  onAir?: { name: string; until: Date };
  /** Unsaved list changes, which moving the end would throw away. */
  dirty: boolean;
  onSaved: (_saved: AirtimeGrant) => Promise<void>;
}) => {
  const [time, setTime] = useState(formatOsloTime(grant.endtime));
  const [error, setError] = useState<string>();
  const update = useGrantsPartialUpdate();
  const endtime = endFromTime(grant, time);
  const changed = endtime !== undefined && Date.parse(endtime) !== Date.parse(grant.endtime);
  const [warnings, setWarnings] = useState<string[]>([]);

  /** What the new end would do to what is on air or about to be. */
  const askThenSave = () => {
    if (!endtime) return;
    const now = timeNow();
    const end = new Date(endtime);
    const found: string[] = [];
    if (onAir && end < onAir.until) found.push(cutWarning(onAir.name, end, now));
    else if (end.getTime() - now < CLOSE_CALL_MILLISECONDS)
      found.push(
        `Sendetiden slutter da kl. ${clock(end)}, om under to minutter. Det som skulle gå etter det, tas av.`,
      );
    if (found.length > 0) setWarnings(found);
    else void save();
  };

  const save = async () => {
    if (!endtime) return;
    setWarnings([]);
    setError(undefined);
    try {
      await update.mutateAsync({ id: grant.id, data: { endtime } });
      // The answer only echoes the change; the list may have lost entries.
      await onSaved((await grantsRetrieve(grant.id)).data);
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <section aria-labelledby="grant-end" className="space-y-2 border-t border-default-200 pt-3">
      <h3 className="font-semibold" id="grant-end">
        Sendetidens slutt
      </h3>
      <p className="text-sm text-default-600">
        Som ansatt kan du korte ned eller forlenge sendetiden, også mens den er på lufta, for
        eksempel for å få plass til noe rett etter. Det som ikke lenger får plass, tas ut av listen.
        Slutter den før det som går nå er ferdig, kuttes det.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          Slutter kl.
          <input
            className="rounded-lg border border-default-300 bg-background px-3 py-2"
            type="time"
            value={time}
            onChange={(event) => {
              setTime(event.target.value);
              setError(undefined);
            }}
          />
        </label>
        <HeroButton
          isDisabled={!changed || dirty}
          isPending={update.isPending}
          variant="secondary"
          onPress={askThenSave}
        >
          Endre slutt
        </HeroButton>
        {dirty && changed ? (
          <span className="text-sm text-default-600">Lagre eller forkast listen først.</span>
        ) : null}
      </div>
      {error ? (
        <p className="border-l-4 border-danger bg-danger-50 p-3 text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
      <OnAirConfirm
        pending={update.isPending}
        warnings={warnings}
        onCancel={() => setWarnings([])}
        onConfirm={() => void save()}
      />
    </section>
  );
};
