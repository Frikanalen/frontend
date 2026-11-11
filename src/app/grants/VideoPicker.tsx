"use client";
import { FormInput } from "@/components/FormField";
import type { GrantItemVideo, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosList } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { Button as HeroButton } from "@heroui/react";
import { useState } from "react";
import { Button, GridList, GridListItem, useDragAndDrop } from "react-aria-components";
import { GoGrabber } from "react-icons/go";
import { durationMilliseconds, formatDuration } from "./duration";

type Scope = "own" | "pending" | "all";

/** The drag type a library video travels under, as JSON of a GrantItemVideo. */
export const VIDEO_DRAG_TYPE = "application/x-frikanalen-video";

const toGrantVideo = (video: Video): GrantItemVideo => ({
  id: video.id,
  name: video.name,
  duration: video.duration ?? "",
  organization: { id: video.organization.id, name: video.organization.name },
  pendingUpload: !video.properImport,
});

const lengthText = (duration: string | undefined) => {
  const milliseconds = duration ? durationMilliseconds(duration) : undefined;
  return milliseconds ? formatDuration(milliseconds) : "Ukjent lengde";
};

/**
 * The videos a list can draw from. Drag one onto the list to put it where it
 * should play, or press "Legg til" to put it last. A grant may list any
 * organization's video; the organization's own come first, and its entries
 * still waiting for a file are a separate view, since the public catalogue
 * leaves them out.
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
  const videos = useVideosList({
    organization: scope === "all" ? undefined : organizationId,
    proper_import: scope === "pending" ? false : undefined,
    q: search || undefined,
    ordering: "-created_time",
    limit: 30,
  });
  const results = (videos.data?.data.results ?? []).filter((video) => video.duration);

  const { dragAndDropHooks } = useDragAndDrop<Video>({
    getItems: (keys, items) =>
      items
        .filter((video) => keys.has(video.id))
        .map((video) => ({
          [VIDEO_DRAG_TYPE]: JSON.stringify(toGrantVideo(video)),
          "text/plain": video.name,
        })),
  });

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Videoer</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Hvilke videoer">
        {(
          [
            ["own", "Våre videoer"],
            ["pending", "Venter på fil"],
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
      {scope === "pending" ? (
        <p className="text-sm text-default-600">
          En video uten fil kan settes opp når lengden er fylt inn for hånd. Filen kan komme etter
          at listen er låst.
        </p>
      ) : null}
      {videos.isLoading ? <p>Laster videoer…</p> : null}
      {videos.isError ? <p role="alert">{formatApiError(videos.error)}</p> : null}
      <GridList
        aria-label="Videoer du kan legge til"
        className="max-h-[28rem] space-y-1 overflow-y-auto"
        dragAndDropHooks={dragAndDropHooks}
        items={results}
        renderEmptyState={() =>
          videos.isLoading ? null : <p className="p-2">Ingen videoer funnet.</p>
        }
        selectionMode="none"
      >
        {(video) => (
          <GridListItem
            className="flex cursor-grab items-center gap-2 rounded-lg border border-default-200 bg-background p-2 outline-none data-[dragging]:opacity-50 data-[focus-visible]:ring-2 data-[focus-visible]:ring-focus"
            id={video.id}
            textValue={video.name}
          >
            <Button aria-label={`Dra «${video.name}»`} className="text-default-400" slot="drag">
              <GoGrabber aria-hidden />
            </Button>
            <div className="min-w-0 grow">
              <div className="truncate font-medium">{video.name}</div>
              <div className="text-sm text-default-500">
                {lengthText(video.duration)}
                {(durationMilliseconds(video.duration ?? "") ?? 0) > remaining ? (
                  <span className="text-danger-700"> · for lang for resten</span>
                ) : null}
                {video.properImport ? "" : " · venter på fil"}
                {scope === "all" ? ` · ${video.organization.name}` : ""}
              </div>
            </div>
            <HeroButton size="sm" variant="tertiary" onPress={() => onPick(toGrantVideo(video))}>
              Legg til
            </HeroButton>
          </GridListItem>
        )}
      </GridList>
    </section>
  );
};
