"use client";
import { FormInput } from "@/components/FormField";
import type { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosList } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { Button as HeroButton } from "@heroui/react";
import { useState } from "react";
import { Button, GridList, GridListItem, useDragAndDrop } from "react-aria-components";
import { GoGrabber } from "react-icons/go";
import { durationMilliseconds, formatDuration } from "./duration";
import type { DraftItem } from "./grants";
import { ENTRY_DRAG_TYPE } from "./grants";
import { LivePicker } from "./LivePicker";

type Scope = "own" | "placeholder" | "live" | "all";

const toEntry = (video: Video): DraftItem => ({
  video: {
    id: video.id,
    name: video.name,
    duration: video.duration ?? "",
    organization: { id: video.organization.id, name: video.organization.name },
    pendingUpload: !video.properImport,
  },
  liveTransmission: null,
});

const lengthText = (duration: string | undefined) => {
  const milliseconds = duration ? durationMilliseconds(duration) : undefined;
  return milliseconds ? formatDuration(milliseconds) : "Ukjent lengde";
};

/**
 * What a list can draw from. Drag an entry onto the list to put it where it
 * should play, or press "Legg til" to put it last. A grant may list any
 * organization's video; the organization's own come first. Placeholders
 * (entries whose file hasn't come yet) are a separate view, since the
 * public catalogue leaves them out, and so are the organization's live
 * sources, which take a length and a title instead of a video.
 */
export const VideoPicker = ({
  organizationId,
  remaining,
  onPick,
}: {
  organizationId: number;
  /** Time left in the window, so each video can say whether it still fits. */
  remaining: number;
  onPick: (_entry: DraftItem) => void;
}) => {
  const [scope, setScope] = useState<Scope>("own");
  const [search, setSearch] = useState("");
  const [onlyFitting, setOnlyFitting] = useState(false);
  const videos = useVideosList(
    {
      organization: scope === "all" ? undefined : organizationId,
      proper_import: scope === "placeholder" ? false : undefined,
      q: search || undefined,
      ordering: "-created_time",
      limit: 30,
    },
    { query: { enabled: scope !== "live" } },
  );
  const fits = (video: Video) => (durationMilliseconds(video.duration ?? "") ?? 0) <= remaining;
  // Videos that still fit come first, newest first within each group.
  const withLength = (videos.data?.data.results ?? []).filter((video) => video.duration);
  const results = [
    ...withLength.filter(fits),
    ...(onlyFitting ? [] : withLength.filter((video) => !fits(video))),
  ];

  const { dragAndDropHooks } = useDragAndDrop<Video>({
    getItems: (keys, items) =>
      items
        .filter((video) => keys.has(video.id))
        .map((video) => ({
          [ENTRY_DRAG_TYPE]: JSON.stringify(toEntry(video)),
          "text/plain": video.name,
        })),
  });

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Legg til</h2>
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
      {scope === "live" ? (
        <LivePicker organizationId={organizationId} remaining={remaining} onPick={onPick} />
      ) : (
        <>
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
              En plassholder er en video som ennå ikke har fil. Den kan settes opp når lengden er
              fylt inn for hånd, og filen kan komme etter at listen er låst.
            </p>
          ) : null}
          {videos.isLoading ? <p>Laster videoer…</p> : null}
          {videos.isError ? <p role="alert">{formatApiError(videos.error)}</p> : null}
          <GridList
            aria-label="Videoer du kan legge til"
            className="max-h-[28rem] space-y-1 overflow-y-auto"
            // Whether a video still fits changes as the list does.
            dependencies={[remaining, scope]}
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
                <div className="min-w-0 grow">
                  <div className="truncate font-medium">{video.name}</div>
                  <div className="text-sm text-default-500">
                    {lengthText(video.duration)}
                    {!fits(video) ? (
                      <span className="text-danger-700"> · for lang for resten</span>
                    ) : null}
                    {video.properImport ? "" : " · venter på fil"}
                    {scope === "all" ? ` · ${video.organization.name}` : ""}
                  </div>
                </div>
                <HeroButton size="sm" variant="tertiary" onPress={() => onPick(toEntry(video))}>
                  Legg til
                </HeroButton>
              </GridListItem>
            )}
          </GridList>
        </>
      )}
    </section>
  );
};
