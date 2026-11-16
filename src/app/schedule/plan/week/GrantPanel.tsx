"use client";
import { durationMilliseconds, formatDuration } from "@/app/grants/duration";
import { FillBar } from "@/app/grants/FillBar";
import { grantHref } from "@/app/grants/GrantCard";
import { GrantTimesControl } from "@/app/grants/GrantTimesControl";
import {
  fillSourceLabel,
  isAutomatic,
  isOnAir,
  itemName,
  itemStatus,
  itemsPayload,
  listMilliseconds,
  readOnlyReason,
  roomForProgramme,
  splitItems,
  timeline,
  windowMilliseconds,
} from "@/app/grants/grants";
import { LockBadge } from "@/app/grants/LockBadge";
import { ModeBadge } from "@/app/grants/ModeBadge";
import { cutWarning, OnAirConfirm, timeNow } from "@/app/grants/OnAirConfirm";
import { ButtonLink } from "@/components/ButtonLink";
import type { AirtimeGrant, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantsItemsUpdate, useGrantsPartialUpdate } from "@/generated/grants/grants";
import { formatApiError } from "@/lib/formatApiError";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { useState } from "react";
import { GoX } from "react-icons/go";
import { VideoChooser } from "./VideoChooser";

/**
 * One grant, picked on the week: who has it, what is in it and how full it
 * is. Staff add a video to it here, move its times, open the full list
 * editor, or delete it, also while it is on air.
 */
export const GrantPanel = ({
  grant,
  now,
  onClose,
  onDeleted,
}: {
  grant: AirtimeGrant;
  now: number;
  onClose: () => void;
  onDeleted: () => void;
}) => {
  const queryClient = useQueryClient();
  const cancel = useGrantsPartialUpdate();
  const save = useGrantsItemsUpdate();
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [warnings, setWarnings] = useState<string[]>([]);
  const automatic = isAutomatic(grant);
  const onAir = isOnAir(grant, now);
  const { rows, graphics } = timeline(
    grant.items,
    { ...grant, startedItems: onAir ? grant.startedItems : undefined },
    now,
  );
  // On air the whole list is kept as it is, so what is on air stays on.
  const chosen = onAir ? grant.items : splitItems(grant, grant.items).chosen;
  const ended = Date.parse(grant.endtime) <= now;
  const room = roomForProgramme(chosen, grant);
  const live = onAir
    ? rows
        .slice(0, grant.startedItems)
        .filter((row) => row.end.getTime() > now)
        .at(-1)
    : undefined;
  const liveProgramme = live ? { name: itemName(live.item), until: live.end } : undefined;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/grants"] });

  const add = async (video: Video) => {
    setError(undefined);
    try {
      await save.mutateAsync({
        id: grant.id,
        data: {
          items: [...itemsPayload(chosen), { video: video.id }],
          automatic: automatic && !onAir,
        },
      });
      setAdding(false);
      await refresh();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  const remove = async () => {
    setError(undefined);
    setWarnings([]);
    try {
      await cancel.mutateAsync({ id: grant.id, data: { state: "cancelled" } });
      await refresh();
      onDeleted();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <section aria-labelledby="grant-heading" className="space-y-4 bg-background p-5">
      <header className="flex items-start gap-2">
        <div className="min-w-0 grow">
          <h2 className="text-lg font-bold" id="grant-heading">
            {grant.organization.name}
          </h2>
          <p className="text-sm first-letter:uppercase">
            {format(inOsloTime(grant.starttime), "EEEE d. MMMM", { locale: nb })}{" "}
            {formatOsloTime(grant.starttime)}–{formatOsloTime(grant.endtime)}
          </p>
        </div>
        <Button aria-label="Lukk" isIconOnly size="sm" variant="tertiary" onPress={onClose}>
          <GoX aria-hidden />
        </Button>
      </header>

      <div className="flex flex-wrap gap-1">
        <ModeBadge automatic={automatic} empty={rows.length === 0} />
        <LockBadge grant={grant} now={now} />
        {grant.originSlot ? (
          <span className="rounded-md bg-default-100 px-2 py-0.5 text-xs">Fra fast sendeflate</span>
        ) : (
          <span className="rounded-md bg-default-100 px-2 py-0.5 text-xs">Gitt én gang</span>
        )}
      </div>

      <FillBar
        automatic={automatic}
        used={listMilliseconds(grant.items, grant)}
        window={windowMilliseconds(grant)}
      />
      {automatic ? (
        <p className="text-sm text-default-600">Fylles fra {fillSourceLabel(grant)}.</p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm">Ingenting er satt opp. Sendetiden viser grafikk.</p>
      ) : (
        <ol className="space-y-0.5 text-sm">
          {rows.map((row, index) => (
            <li className="flex gap-2" key={index}>
              <span className="font-semibold tabular-nums">{formatOsloTime(row.start)}</span>
              <span className="min-w-0 truncate">
                {itemName(row.item)}
                {itemStatus(row.item) ? ` (${itemStatus(row.item)})` : ""}
              </span>
            </li>
          ))}
          {graphics ? (
            <li className="flex gap-2 text-default-600">
              <span className="tabular-nums">{formatOsloTime(graphics.start)}</span>
              <span>Grafikk</span>
            </li>
          ) : null}
        </ol>
      )}

      {grant.canEdit ? null : (
        <p className="text-sm text-default-600">{readOnlyReason(grant, now)}</p>
      )}

      {grant.canEdit && !ended ? (
        <GrantTimesControl
          grant={grant}
          key={`${grant.starttime}-${grant.endtime}`}
          now={now}
          onAir={liveProgramme}
          onSaved={async () => {
            await refresh();
          }}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={grantHref(grant)} size="sm">
          {grant.canEdit ? "Åpne sendelisten" : "Se listen"}
        </ButtonLink>
        {grant.canEdit && !adding ? (
          <Button size="sm" variant="secondary" onPress={() => setAdding(true)}>
            Legg til en video
          </Button>
        ) : null}
      </div>

      {adding ? (
        <div className="space-y-2 border-t border-separator pt-3">
          <div className="flex items-center gap-2">
            <h3 className="grow font-semibold">Legg til en video</h3>
            <Button size="sm" variant="tertiary" onPress={() => setAdding(false)}>
              Avbryt
            </Button>
          </div>
          <p className="text-sm text-default-600">
            Videoen legges etter det som er valgt fra før
            {automatic ? ", og resten fylles automatisk som før" : ""}. Det er{" "}
            {formatDuration(Math.max(0, room))} ledig.
          </p>
          <VideoChooser
            organizationId={grant.organization.id}
            room={room}
            onSelect={(video) => {
              if ((durationMilliseconds(video.duration ?? "") ?? 0) > room) {
                setError(`«${video.name}» er lengre enn tiden som er ledig.`);
                return;
              }
              void add(video);
            }}
          />
        </div>
      ) : null}

      <div className="border-t border-separator pt-3">
        {ended ? (
          <p className="text-sm text-default-600">Sendetid som er sendt, kan ikke slettes.</p>
        ) : onAir ? (
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => {
              const at = timeNow();
              setWarnings([
                ...(liveProgramme ? [cutWarning(liveProgramme.name, new Date(at), at)] : []),
                `${grant.organization.name} mister resten av sendetiden, og det som skulle gå videre, tas av sendeplanen.`,
              ]);
            }}
          >
            Slett sendetiden
          </Button>
        ) : confirming ? (
          <div className="space-y-2" role="group" aria-label="Bekreft sletting">
            <p className="text-sm font-medium">
              Slette denne sendetiden? {grant.organization.name} mister den, og det som er satt opp
              i den, tas av sendeplanen.
              {grant.originSlot
                ? " Den faste sendeflaten gir fortsatt sendetid de andre ukene."
                : ""}
            </p>
            <div className="flex gap-2">
              <Button
                isPending={cancel.isPending}
                size="sm"
                variant="danger"
                onPress={() => void remove()}
              >
                Slett sendetiden
              </Button>
              <Button size="sm" variant="tertiary" onPress={() => setConfirming(false)}>
                Avbryt
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="danger-soft" onPress={() => setConfirming(true)}>
            Slett sendetiden
          </Button>
        )}
      </div>

      {error ? (
        <p className="text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
      <OnAirConfirm
        pending={cancel.isPending}
        warnings={warnings}
        onCancel={() => setWarnings([])}
        onConfirm={() => void remove()}
      />
    </section>
  );
};
