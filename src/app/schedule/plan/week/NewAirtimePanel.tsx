"use client";
import { osloInstant } from "@/app/requests/dates";
import { windowText } from "@/app/requests/requests";
import { durationMilliseconds, formatDuration } from "@/app/grants/duration";
import { isAutomatic, itemsPayload, roomForProgramme, splitItems } from "@/app/grants/grants";
import { osloToday } from "@/app/schedule/plan/slots/slots";
import { ClockField } from "@/components/time/ClockField";
import { DayField } from "@/components/time/DayField";
import { TimeRange } from "@/components/time/TimeRange";
import type { AirtimeGrant, Organization, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantsCreate, useGrantsItemsUpdate } from "@/generated/grants/grants";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import cx from "classnames";
import { useEffect, useState } from "react";
import { GoX } from "react-icons/go";
import { VideoChooser } from "./VideoChooser";
import { overlapping } from "./week";

const fieldClass = "rounded-lg border border-default-300 bg-background px-3 py-2";

/** A stretch of free time picked on the week. */
export type Selection = { date: string; start: number; duration: number };
type Mode = "airtime" | "video";

/**
 * What staff do with free time picked on the week: give an organization
 * airtime there, or set up one of its videos there, which gives it airtime
 * exactly as long as the video with the video already in it.
 */
export const NewAirtimePanel = ({
  selection,
  grants,
  organizations,
  onSelectionChange,
  onPreview,
  onCreated,
  onClose,
  now,
}: {
  /** The week's clock. */
  now: number;
  selection: Selection;
  /** The week's grants, to warn about a collision before the server does. */
  grants: AirtimeGrant[];
  organizations: Organization[];
  onSelectionChange: (_selection: Selection) => void;
  /** The stretch to draw on the week as the new airtime. */
  onPreview: (_stretch: { starttime: string; endtime: string } | null) => void;
  onCreated: (_grant: AirtimeGrant) => void;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const create = useGrantsCreate();
  const addTo = useGrantsItemsUpdate();
  const [mode, setMode] = useState<Mode>("airtime");
  const [organization, setOrganization] = useState<number | "">("");
  const [automatic, setAutomatic] = useState(true);
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState<string>();

  // Suspended organizations get no airtime; the API says the same.
  const offered = organizations.filter((candidate) => !candidate.isRogue);
  const videoLength = video ? (durationMilliseconds(video.duration ?? "") ?? 0) : 0;

  const starttime = osloInstant(selection.date, selection.start);
  const endtime =
    mode === "video" && video
      ? new Date(Date.parse(starttime) + videoLength).toISOString()
      : osloInstant(selection.date, selection.start + selection.duration);

  useEffect(() => {
    onPreview({ starttime, endtime });
  }, [starttime, endtime, onPreview]);
  useEffect(() => () => onPreview(null), [onPreview]);

  const update = (changes: Partial<Selection>) => {
    setError(undefined);
    onSelectionChange({ ...selection, ...changes });
  };

  const collisions = overlapping(grants, starttime, endtime);
  // A video at a time the organization already has: it can go in there.
  const host =
    mode === "video" &&
    collisions.length === 1 &&
    collisions[0].organization.id === organization &&
    collisions[0].canEdit &&
    Date.parse(collisions[0].starttime) <= Date.parse(starttime)
      ? collisions[0]
      : null;

  const invalid =
    organization === ""
      ? "Velg organisasjon."
      : mode === "video" && !video
        ? "Velg en video."
        : selection.date < osloToday() || Date.parse(starttime) <= now
          ? "Velg en tid som ikke er passert."
          : mode === "airtime" && selection.duration < 5
            ? "Velg en lengde."
            : null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/grants"] });

  const submit = async () => {
    if (organization === "") return;
    setError(undefined);
    try {
      const response = await create.mutateAsync({
        data: {
          organization,
          starttime,
          endtime,
          ...(mode === "video" && video
            ? { recipe: null, items: [{ video: video.id }] }
            : { recipe: automatic ? { kind: "uploads" } : null }),
        },
      });
      await refresh();
      onCreated(response.data);
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const putInHost = async () => {
    if (!host || !video) return;
    setError(undefined);
    const { chosen } = splitItems(host, host.items);
    if (videoLength > roomForProgramme(chosen, host)) {
      setError("Det er ikke plass til videoen i den sendetiden.");
      return;
    }
    try {
      const response = await addTo.mutateAsync({
        id: host.id,
        data: {
          items: [...itemsPayload(chosen), { video: video.id }],
          automatic: isAutomatic(host),
        },
      });
      await refresh();
      onCreated(response.data);
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <form
      aria-labelledby="new-heading"
      className="space-y-4 bg-background p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <header className="flex items-start gap-2">
        <h2 className="grow text-lg font-bold" id="new-heading">
          Ledig tid
        </h2>
        <Button aria-label="Lukk" isIconOnly size="sm" variant="tertiary" onPress={onClose}>
          <GoX aria-hidden />
        </Button>
      </header>

      <div className="flex border-b border-default-200" role="group" aria-label="Hva vil du gjøre">
        {(
          [
            ["airtime", "Sendetid"],
            ["video", "Én video"],
          ] as const
        ).map(([value, label]) => (
          <button
            aria-pressed={mode === value}
            className={cx(
              "-mb-px border-b-2 px-3 py-2 text-sm font-semibold",
              mode === value
                ? "border-accent text-foreground"
                : "border-transparent text-default-600 hover:text-foreground",
            )}
            key={value}
            type="button"
            onClick={() => {
              setError(undefined);
              setMode(value);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
        Organisasjon
        <select
          className={fieldClass}
          value={organization}
          onChange={(event) => {
            setError(undefined);
            setVideo(null);
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
        value={selection.date}
        onChange={(value) => value && update({ date: value })}
      />

      {mode === "airtime" ? (
        <>
          <TimeRange
            duration={selection.duration}
            start={selection.start}
            onChange={(range) => update(range)}
          />
          <label className="flex items-start gap-2 text-sm">
            <input
              checked={automatic}
              className="mt-0.5 size-4"
              type="checkbox"
              onChange={(event) => setAutomatic(event.target.checked)}
            />
            <span>
              <span className="font-semibold">Fyll automatisk til de setter opp noe selv</span>
              <span className="block text-default-600">
                Med organisasjonens egne videoer. Uten dette står sendetiden tom til noen setter den
                opp.
              </span>
            </span>
          </label>
        </>
      ) : (
        <>
          <ClockField
            label="Starter kl."
            minutes={selection.start}
            onChange={(start) => update({ start })}
          />
          {organization === "" ? (
            <p className="text-sm text-default-600">Velg organisasjon for å se videoene deres.</p>
          ) : (
            <VideoChooser
              organizationId={organization}
              selected={video?.id}
              onSelect={(picked) => {
                setError(undefined);
                setVideo(picked);
              }}
            />
          )}
          {video ? (
            <p className="text-sm">
              «{video.name}» går {windowText(starttime, endtime)} ({formatDuration(videoLength)}).
            </p>
          ) : null}
        </>
      )}

      {host ? (
        <div className="space-y-2 bg-default-100 p-3 text-sm">
          <p>
            {host.organization.name} har allerede sendetid{" "}
            {windowText(host.starttime, host.endtime)}. Legg videoen inn der i stedet, etter det som
            er valgt fra før.
          </p>
          <Button
            isPending={addTo.isPending}
            size="sm"
            variant="secondary"
            onPress={() => void putInHost()}
          >
            Legg inn i den sendetiden
          </Button>
        </div>
      ) : collisions.length > 0 ? (
        <p className="bg-warning/20 px-3 py-2 text-sm" role="status">
          Tiden overlapper sendetid for{" "}
          {[...new Set(collisions.map((grant) => grant.organization.name))].join(", ")}. Slett eller
          flytt den først.
        </p>
      ) : null}

      {error || invalid ? (
        <p className={cx("text-sm", error && "font-medium text-danger-700")} role="alert">
          {error ?? invalid}
        </p>
      ) : null}

      <Button
        isDisabled={!!invalid || collisions.length > 0}
        isPending={create.isPending}
        type="submit"
        variant="primary"
      >
        {mode === "video" ? "Gi sendetid med videoen" : "Gi sendetid"}
      </Button>
      <p className="text-xs text-default-600">
        Sendetiden gis med en gang, uten forespørsel. Er den vanlige fristen passert, kan listen
        endres helt frem til sending, og den kommer på sendeplanen med en gang.
      </p>
    </form>
  );
};
