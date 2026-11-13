"use client";
import { nextDate, osloInstant, weekdayOf } from "@/app/requests/dates";
import { windowText } from "@/app/requests/requests";
import { SlotPlanner } from "@/app/schedule/plan/slots/SlotPlanner";
import { osloToday, type Shape } from "@/app/schedule/plan/slots/slots";
import { DayField } from "@/components/time/DayField";
import { TimeRange } from "@/components/time/TimeRange";
import type { AirtimeGrant, Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantsCreate } from "@/generated/grants/grants";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import cx from "classnames";
import Link from "next/link";
import { useState } from "react";

const fieldClass = "rounded-lg border border-default-300 bg-background px-3 py-2";

/**
 * Staff give an organization airtime one time, without a request: the week
 * as it is taken, and a form beside it. The airtime exists as soon as the
 * form is sent, and the organization can set it up straight away.
 */
export const GiveAirtime = ({
  organizations,
  initialOrganization,
}: {
  organizations: Organization[];
  initialOrganization?: number;
}) => {
  const queryClient = useQueryClient();
  const create = useGrantsCreate();
  const [shape, setShape] = useState<Shape | null>(null);
  const [organization, setOrganization] = useState<number | "">(initialOrganization ?? "");
  const [chosenDate, setDate] = useState(() => nextDate(0));
  const [automatic, setAutomatic] = useState(true);
  const [error, setError] = useState<string>();
  const [given, setGiven] = useState<AirtimeGrant>();

  const current = shape ?? { days: [weekdayOf(chosenDate)], start: 19 * 60, duration: 60 };
  const weekday = current.days[0] ?? 0;
  // A day picked on the week moves the date to the next such day.
  const date = weekdayOf(chosenDate) === weekday ? chosenDate : nextDate(weekday);
  const update = (changes: Partial<Shape>) => {
    setGiven(undefined);
    setShape({ ...current, ...changes });
  };

  // Suspended organizations get no airtime; the API says the same.
  const offered = organizations.filter((candidate) => !candidate.isRogue);

  const invalid =
    organization === ""
      ? "Velg hvilken organisasjon som skal ha sendetiden."
      : current.duration < 5
        ? "Velg en lengde."
        : date < osloToday()
          ? "Velg en dato som ikke er passert."
          : null;

  const submit = async () => {
    if (organization === "") return;
    setError(undefined);
    try {
      const response = await create.mutateAsync({
        data: {
          organization,
          starttime: osloInstant(date, current.start),
          endtime: osloInstant(date, current.start + current.duration),
          recipe: automatic ? { kind: "uploads" } : null,
        },
      });
      setGiven(response.data);
      await queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <SlotPlanner
      organizations={[]}
      pick={{
        selection: current,
        onSelect: (picked) => {
          setGiven(undefined);
          setShape(picked);
        },
        side: (
          <form
            aria-labelledby="give-heading"
            className="space-y-4 bg-background p-5"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <h2 className="text-lg font-bold" id="give-heading">
              Gi sendetid
            </h2>

            <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
              Organisasjon
              <select
                className={fieldClass}
                value={organization}
                onChange={(event) => {
                  setGiven(undefined);
                  setOrganization(event.target.value === "" ? "" : Number(event.target.value));
                }}
              >
                <option disabled value="">
                  Velg organisasjon
                </option>
                {offered.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </label>

            <DayField
              isRequired
              label="Dato"
              min={osloToday()}
              value={date}
              onChange={(value) => {
                if (!value) return;
                setDate(value);
                update({ days: [weekdayOf(value)] });
              }}
            />

            <TimeRange
              duration={current.duration}
              start={current.start}
              onChange={(range) => update(range)}
            />

            <label className="flex items-start gap-2 text-sm">
              <input
                checked={automatic}
                className="mt-0.5 size-4"
                type="checkbox"
                onChange={(event) => {
                  setGiven(undefined);
                  setAutomatic(event.target.checked);
                }}
              />
              <span>
                <span className="font-semibold">Fyll automatisk til de setter opp noe selv</span>
                <span className="block text-default-600">
                  Med organisasjonens egne videoer. Uten dette står sendetiden tom til noen setter
                  den opp.
                </span>
              </span>
            </label>

            <p className="text-sm text-default-600">
              Sendetiden gis med en gang, uten forespørsel, og organisasjonen finner den under
              Sendetid. Er den vanlige fristen alt passert, kan listen endres helt frem til sending.
              Uken viser de faste sendeflatene; kolliderer tiden med annen sendetid, får du beskjed.
            </p>

            {given ? (
              <p className="bg-success/15 p-3 text-sm font-medium" role="status">
                {given.organization.name} har fått sendetid{" "}
                {windowText(given.starttime, given.endtime)}.{" "}
                <Link
                  className="font-semibold text-link hover:underline"
                  href={`/organization/${given.organization.id}/schedule/${given.id}`}
                >
                  Åpne sendelisten
                </Link>
              </p>
            ) : null}
            {error || invalid ? (
              <p className={cx("text-sm", error && "font-medium text-danger-700")} role="alert">
                {error ?? invalid}
              </p>
            ) : null}

            <Button
              isDisabled={!!invalid || !!given}
              isPending={create.isPending}
              type="submit"
              variant="primary"
            >
              Gi sendetid
            </Button>
          </form>
        ),
      }}
    />
  );
};
