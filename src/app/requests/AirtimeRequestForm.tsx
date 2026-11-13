"use client";
import { useGrantRequestsAirtimeCreate } from "@/generated/grant-requests/grant-requests";
import { useRecurringSlotRequestsCreationCreate } from "@/generated/recurring-slot-requests/recurring-slot-requests";
import type { DayEnum } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { DayField } from "@/components/time/DayField";
import { TimeRange } from "@/components/time/TimeRange";
import cx from "classnames";
import { useState, type ReactNode } from "react";
import {
  WEEKDAYS,
  durationPayload,
  formatTime,
  osloToday,
  type Shape,
} from "@/app/schedule/plan/slots/slots";
import { nextDate, osloInstant, tomorrow, weekdayOf } from "./dates";
import { useRefreshRequests } from "./useRequests";

type Kind = "weekly" | "once";

const fieldClass = "rounded-lg border border-default-300 bg-background px-3 py-2";

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
    {label}
    {children}
  </label>
);

/**
 * Asking Frikanalen for airtime: the same time every week, or one time
 * only. The time can be typed or picked on the week beside the form, which
 * `shape` and `onShapeChange` keep in step.
 */
export const AirtimeRequestForm = ({
  organizationId,
  shape,
  onShapeChange,
  initialKind = "weekly",
}: {
  organizationId: number;
  initialKind?: Kind;
  shape: Shape | null;
  onShapeChange: (_shape: Shape) => void;
}) => {
  const createSlot = useRecurringSlotRequestsCreationCreate();
  const createAirtime = useGrantRequestsAirtimeCreate();
  const refresh = useRefreshRequests();
  const [kind, setKind] = useState<Kind>(initialKind);
  const [chosenDate, setDate] = useState(() => nextDate(shape?.days[0] ?? 0));
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  const current = shape ?? { days: [0], start: 19 * 60, duration: 60 };
  const weekday = current.days[0] ?? 0;
  // A day picked on the week moves the date to the next such day.
  const date = weekdayOf(chosenDate) === weekday ? chosenDate : nextDate(weekday);
  const update = (changes: Partial<Shape>) => {
    setSent(false);
    onShapeChange({ ...current, ...changes });
  };

  const submit = async () => {
    setError(undefined);
    try {
      if (kind === "weekly") {
        await createSlot.mutateAsync({
          data: {
            organization: organizationId,
            day: weekday as DayEnum,
            startTime: formatTime(current.start),
            duration: durationPayload(current.duration),
            message,
          },
        });
      } else {
        await createAirtime.mutateAsync({
          data: {
            organization: organizationId,
            starttime: osloInstant(date, current.start),
            endtime: osloInstant(date, current.start + current.duration),
            message,
          },
        });
      }
      setSent(true);
      setMessage("");
      await refresh();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const invalid =
    current.duration < 5
      ? "Velg en lengde."
      : kind === "once" && date <= osloToday()
        ? "Velg en dato etter i dag."
        : null;

  return (
    <form
      aria-labelledby="request-heading"
      className="space-y-4 bg-background p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h2 className="text-lg font-bold" id="request-heading">
        Be om sendetid
      </h2>

      <fieldset className="grid grid-cols-2 gap-1">
        <legend className="sr-only">Hvor ofte</legend>
        {(
          [
            ["weekly", "Ukentlig", "En fast sendeflate"],
            ["once", "Én gang", "For eksempel en direktesending"],
          ] as const
        ).map(([value, label, hint]) => (
          <label
            className={cx(
              "flex cursor-pointer flex-col border p-2 text-sm",
              kind === value ? "border-accent bg-accent/10" : "border-default-300",
            )}
            key={value}
          >
            <input
              checked={kind === value}
              className="sr-only"
              name="kind"
              type="radio"
              value={value}
              onChange={() => {
                setKind(value);
                setSent(false);
              }}
            />
            <span className="font-semibold">{label}</span>
            <span className="text-default-600">{hint}</span>
          </label>
        ))}
      </fieldset>

      {kind === "weekly" ? (
        <Field label="Ukedag">
          <select
            className={fieldClass}
            value={weekday}
            onChange={(event) => update({ days: [Number(event.target.value)] })}
          >
            {WEEKDAYS.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <DayField
          isRequired
          label="Dato"
          min={tomorrow()}
          value={date}
          onChange={(value) => {
            setSent(false);
            if (!value) return;
            setDate(value);
            update({ days: [weekdayOf(value)] });
          }}
        />
      )}

      <TimeRange
        duration={current.duration}
        start={current.start}
        onChange={(range) => update(range)}
      />

      <Field label="Melding til Frikanalen (valgfri)">
        <textarea
          className={cx(fieldClass, "min-h-24")}
          placeholder="Hva vil dere sende?"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </Field>

      <p className="text-sm text-default-600">
        {kind === "weekly"
          ? "Frikanalen ser på forespørselen og svarer her. Blir den godkjent, får dere sendetid hver uke fra da av, og den fylles automatisk med deres nyeste videoer til dere setter opp noe selv."
          : "Frikanalen ser på forespørselen og svarer her. Blir den godkjent, finner dere sendetiden under Sendetid."}
      </p>

      {sent ? (
        <p className="bg-success/15 p-3 text-sm font-medium" role="status">
          Forespørselen er sendt.
        </p>
      ) : null}
      {error || invalid ? (
        <p className={cx("text-sm", error && "font-medium text-danger-700")} role="alert">
          {error ?? invalid}
        </p>
      ) : null}

      <Button
        isDisabled={!!invalid}
        isPending={createSlot.isPending || createAirtime.isPending}
        type="submit"
        variant="primary"
      >
        Send forespørsel
      </Button>
    </form>
  );
};
