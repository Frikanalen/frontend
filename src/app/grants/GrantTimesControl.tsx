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

const minutesOf = (time: string) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  return match ? Number(match[1]) * 60 + Number(match[2]) : undefined;
};

/** The start a staff member types, as an instant on the grant's start date in Oslo. */
export const startFromTime = (grant: Pick<AirtimeGrant, "starttime">, time: string) => {
  const minutes = minutesOf(time);
  return minutes === undefined ? undefined : osloInstant(osloPlace(grant.starttime).date, minutes);
};

/**
 * The end a staff member types, as an instant: on the grant's start date in
 * Oslo, or the day after for a time at or before the start (past midnight).
 */
export const endFromTime = (grant: Pick<AirtimeGrant, "starttime">, time: string) => {
  const minutes = minutesOf(time);
  if (minutes === undefined) return undefined;
  const start = osloPlace(grant.starttime);
  const date = minutes <= start.minute ? addDays(start.date, 1) : start.date;
  return osloInstant(date, minutes);
};

/** What moving a grant to `start`–`end` does to what is on air or about to be. */
export const timesWarnings = ({
  start,
  end,
  moveStart,
  onAir,
  now,
}: {
  start: Date;
  end: Date;
  moveStart: boolean;
  onAir?: { name: string; until: Date };
  now: number;
}) => {
  const found: string[] = [];
  if (moveStart && start.getTime() - now < CLOSE_CALL_MILLISECONDS)
    found.push(
      start.getTime() <= now
        ? "Sendetiden starter da med en gang."
        : `Sendetiden starter da kl. ${clock(start)}, om under to minutter.`,
    );
  if (onAir && end < onAir.until) found.push(cutWarning(onAir.name, end, now));
  else if (end.getTime() - now < CLOSE_CALL_MILLISECONDS)
    found.push(
      `Sendetiden slutter da kl. ${clock(end)}, om under to minutter. Det som skulle gå etter det, tas av.`,
    );
  return found;
};

/**
 * Staff move the start of a grant until it is on air, and its end also while
 * it is on air, e.g. to make room before or after it.
 */
export const GrantTimesControl = ({
  grant,
  now,
  dirty = false,
  onAir,
  onSaved,
}: {
  grant: AirtimeGrant;
  /** The clock the page was drawn with. */
  now: number;
  /** The programme on air in this grant, and when it ends. */
  onAir?: { name: string; until: Date };
  /** Unsaved list changes, which moving the times would throw away. */
  dirty?: boolean;
  onSaved: (_saved: AirtimeGrant) => Promise<void>;
}) => {
  const canMoveStart = Date.parse(grant.starttime) > now;
  const [startText, setStartText] = useState(formatOsloTime(grant.starttime));
  const [endText, setEndText] = useState(formatOsloTime(grant.endtime));
  const [error, setError] = useState<string>();
  const [warnings, setWarnings] = useState<string[]>([]);
  const update = useGrantsPartialUpdate();

  const starttime = canMoveStart ? startFromTime(grant, startText) : grant.starttime;
  const endtime = starttime ? endFromTime({ starttime }, endText) : undefined;
  const startChanged =
    starttime !== undefined && Date.parse(starttime) !== Date.parse(grant.starttime);
  const endChanged = endtime !== undefined && Date.parse(endtime) !== Date.parse(grant.endtime);
  const changed = starttime !== undefined && endtime !== undefined && (startChanged || endChanged);

  const save = async () => {
    if (!starttime || !endtime) return;
    setWarnings([]);
    setError(undefined);
    try {
      await update.mutateAsync({
        id: grant.id,
        data: {
          ...(startChanged ? { starttime } : {}),
          ...(endChanged ? { endtime } : {}),
        },
      });
      // The answer only echoes the change; the list may have lost entries.
      await onSaved((await grantsRetrieve(grant.id)).data);
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const askThenSave = () => {
    if (!starttime || !endtime) return;
    const found = timesWarnings({
      start: new Date(starttime),
      end: new Date(endtime),
      moveStart: startChanged,
      onAir,
      now: timeNow(),
    });
    if (found.length > 0) setWarnings(found);
    else void save();
  };

  const field = "rounded-lg border border-default-300 bg-background px-3 py-2";

  return (
    <section aria-labelledby="grant-times" className="space-y-2 border-t border-default-200 pt-3">
      <h3 className="font-semibold" id="grant-times">
        Tidspunkt
      </h3>
      <p className="text-sm text-default-600">
        Som ansatt kan du flytte starten til sendetiden er på lufta, og slutten også mens den er på
        lufta, for eksempel for å få plass til noe rett før eller etter. Det som ikke lenger får
        plass, tas ut av listen. Slutter den før det som går nå er ferdig, kuttes det.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {canMoveStart ? (
          <label className="flex items-center gap-2">
            Starter kl.
            <input
              className={field}
              type="time"
              value={startText}
              onChange={(event) => {
                setStartText(event.target.value);
                setError(undefined);
              }}
            />
          </label>
        ) : null}
        <label className="flex items-center gap-2">
          Slutter kl.
          <input
            className={field}
            type="time"
            value={endText}
            onChange={(event) => {
              setEndText(event.target.value);
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
          Endre tidspunkt
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
