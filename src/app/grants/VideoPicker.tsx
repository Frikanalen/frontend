"use client";
import { FormInput } from "@/components/FormField";
import type { GrantItemVideo, LiveSource, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useOrganizationLiveSourcesList } from "@/generated/organization/organization";
import { useVideosList } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { Button as HeroButton } from "@heroui/react";
import { useState } from "react";
import { Button, GridList, GridListItem, useDragAndDrop } from "react-aria-components";
import { GoBroadcast, GoGrabber } from "react-icons/go";
import { durationMilliseconds, formatDuration } from "./duration";
import { NewProgrammeModal, type ProgrammeKind } from "./NewProgrammeModal";

type Scope = "own" | "placeholder" | "live" | "all";

/** The drag type a library video travels under, as JSON of a GrantItemVideo. */
export const VIDEO_DRAG_TYPE = "application/x-frikanalen-video";

export const toGrantVideo = (video: Video, sources: readonly LiveSource[]): GrantItemVideo => {
  const source = sources.find(({ id }) => id === video.liveSource);
  return {
    id: video.id,
    name: video.name,
    duration: video.duration ?? "",
    organization: { id: video.organization.id, name: video.organization.name },
    pendingUpload: !video.properImport,
    liveSource:
      video.liveSource == null ? null : { id: video.liveSource, name: source?.name ?? "Direkte" },
  };
};

/** Airs live: a live programme whose recording hasn't come as a file. */
const airsLive = (video: Video) => video.liveSource != null && !video.properImport;

const lengthText = (duration: string | undefined) => {
  const milliseconds = duration ? durationMilliseconds(duration) : undefined;
  return milliseconds ? formatDuration(milliseconds) : "Ukjent lengde";
};

/**
 * The videos a list can draw from. Drag one onto the list to put it where it
 * should play, or press "Legg til" to put it last. A grant may list any
 * organization's video; the organization's own come first. Its entries still
 * waiting for a file are separate views, since the public catalogue leaves
 * them out: placeholders, and live programmes, which air from a live source
 * until their recording arrives.
 */
export const VideoPicker = ({
  organizationId,
  remaining,
  onPick,
}: {
  organizationId: number;
  /** Time left in the window, so each video can say whether it still fits. */
  remaining: number;
  onPick: (_video: GrantItemVideo) => void;
}) => {
  const [scope, setScope] = useState<Scope>("own");
  const [search, setSearch] = useState("");
  const [onlyFitting, setOnlyFitting] = useState(false);
  const [creating, setCreating] = useState<ProgrammeKind>();
  const sourcesQuery = useOrganizationLiveSourcesList(organizationId);
  const sources = sourcesQuery.data?.data ?? [];
  const waiting = scope === "placeholder" || scope === "live";
  const videos = useVideosList({
    organization: scope === "all" ? undefined : organizationId,
    proper_import: waiting ? false : undefined,
    q: search || undefined,
    ordering: "-created_time",
    limit: 30,
  });
  const fits = (video: Video) => (durationMilliseconds(video.duration ?? "") ?? 0) <= remaining;
  // Videos that still fit come first, newest first within each group.
  const inScope = (video: Video) =>
    scope === "placeholder" ? video.liveSource == null : scope === "live" ? airsLive(video) : true;
  const withLength = (videos.data?.data.results ?? []).filter(
    (video) => video.duration && inScope(video),
  );
  const results = [
    ...withLength.filter(fits),
    ...(onlyFitting ? [] : withLength.filter((video) => !fits(video))),
  ];

  const { dragAndDropHooks } = useDragAndDrop<Video>({
    getItems: (keys, items) =>
      items
        .filter((video) => keys.has(video.id))
        .map((video) => ({
          [VIDEO_DRAG_TYPE]: JSON.stringify(toGrantVideo(video, sources)),
          "text/plain": video.name,
        })),
  });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="me-auto text-lg font-semibold">Videoer</h2>
        <HeroButton size="sm" variant="secondary" onPress={() => setCreating("placeholder")}>
          Ny plassholder
        </HeroButton>
        <HeroButton size="sm" variant="secondary" onPress={() => setCreating("live")}>
          <GoBroadcast aria-hidden />
          Ny direktesending
        </HeroButton>
      </div>
      <NewProgrammeModal
        kind={creating}
        organizationId={organizationId}
        remaining={remaining}
        sources={sources.filter(({ enabled }) => enabled)}
        onClose={() => setCreating(undefined)}
        onCreated={(video) => onPick(toGrantVideo(video, sources))}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Hvilke videoer">
        {(
          [
            ["own", "Våre videoer"],
            ["placeholder", "Plassholdere"],
            ["live", "Direktesending"],
            ["all", "Alle organisasjoner"],
          ] as const
        ).map(([value, label]) => (
          <HeroButton
            key={value}
            size="sm"
            variant={scope === value ? "primary" : "tertiary"}
            onPress={() => setScope(value)}
          >
            {label}
          </HeroButton>
        ))}
      </div>
      <FormInput label="Søk" type="search" value={search} onValueChange={setSearch} />
      <label className="flex items-center gap-2 text-sm">
        <input
          checked={onlyFitting}
          type="checkbox"
          onChange={(event) => setOnlyFitting(event.target.checked)}
        />
        Bare videoer som får plass ({formatDuration(Math.max(0, remaining))} igjen)
      </label>
      {scope === "placeholder" ? (
        <p className="text-sm text-default-600">
          En plassholder er en video som venter på fil. Den kan settes opp når lengden er fylt inn,
          og filen kan komme etter at listen er låst.
        </p>
      ) : null}
      {scope === "live" ? (
        <p className="text-sm text-default-600">
          En direktesending sendes direkte fra en av organisasjonens direktekilder, helt til det
          lastes opp et opptak til den.
        </p>
      ) : null}
      {videos.isLoading ? <p>Laster videoer…</p> : null}
      {videos.isError ? <p role="alert">{formatApiError(videos.error)}</p> : null}
      <GridList
        aria-label="Videoer du kan legge til"
        className="max-h-[28rem] space-y-1 overflow-y-auto"
        // Rows say whether they fit and where they air from, which isn't in the items.
        dependencies={[remaining, scope, sources]}
        dragAndDropHooks={dragAndDropHooks}
        items={results}
        renderEmptyState={() =>
          videos.isLoading ? null : (
            <p className="p-2">
              {onlyFitting && withLength.length > 0
                ? "Ingen av disse videoene får plass i tiden som er igjen."
                : "Ingen videoer funnet."}
            </p>
          )
        }
        selectionMode="none"
      >
        {(video) => (
          <GridListItem
            className="flex cursor-grab items-center gap-2 rounded-lg border border-default-200 bg-background p-2 outline-none data-[dragging]:opacity-50 data-[focus-visible]:ring-2 data-[focus-visible]:ring-focus"
            id={video.id}
            textValue={video.name}
          >
            <Button
              aria-label={`Dra «${video.name}»`}
              className="cursor-grab rounded p-1 text-lg text-foreground/70 hover:bg-default-100"
              slot="drag"
            >
              <GoGrabber aria-hidden />
            </Button>
            {airsLive(video) ? (
              <GoBroadcast aria-label="Direktesending" className="shrink-0 text-danger-600" />
            ) : null}
            <div className="min-w-0 grow">
              <div className="truncate font-medium">{video.name}</div>
              <div className="text-sm text-default-500">
                {lengthText(video.duration)}
                {!fits(video) ? (
                  <span className="text-danger-700"> · for lang for resten</span>
                ) : null}
                {airsLive(video)
                  ? ` · direkte fra ${toGrantVideo(video, sources).liveSource?.name}`
                  : video.properImport
                    ? ""
                    : " · venter på fil"}
                {scope === "all" ? ` · ${video.organization.name}` : ""}
              </div>
            </div>
            <HeroButton
              size="sm"
              variant="tertiary"
              onPress={() => onPick(toGrantVideo(video, sources))}
            >
              Legg til
            </HeroButton>
          </GridListItem>
        )}
      </GridList>
    </section>
  );
};
