"use client";
import { FormInput } from "@/components/FormField";
import type { GrantItemVideo, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosList } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useState } from "react";
import { durationMilliseconds, formatDuration } from "./duration";

type Scope = "own" | "pending" | "all";

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
 * Finds a video to add to a grant's list. A grant may list any organization's
 * video; the organization's own come first, and its entries still waiting for
 * a file are a separate view, since the public catalogue leaves them out.
 */
export const VideoPicker = ({
  organizationId,
  onPick,
}: {
  organizationId: number;
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
  const results = videos.data?.data.results ?? [];

  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Legg til video</h3>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Hvilke videoer">
        {(
          [
            ["own", "Våre videoer"],
            ["pending", "Venter på fil"],
            ["all", "Alle organisasjoner"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="sm"
            variant={scope === value ? "primary" : "tertiary"}
            onPress={() => setScope(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <FormInput label="Søk" type="search" value={search} onValueChange={setSearch} />
      {scope === "pending" ? (
        <p className="text-sm text-default-600">
          En video uten fil kan settes opp hvis lengden er fylt inn for hånd. Filen kan komme etter
          at listen er låst.
        </p>
      ) : null}
      {videos.isLoading ? <p>Laster videoer…</p> : null}
      {videos.isError ? <p role="alert">{formatApiError(videos.error)}</p> : null}
      <ul className="max-h-80 space-y-1 overflow-y-auto">
        {results.map((video) => (
          <li
            className="flex items-center justify-between gap-2 border-b border-default-100 py-2"
            key={video.id}
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{video.name}</div>
              <div className="text-sm text-default-500">
                {lengthText(video.duration)}
                {scope === "all" ? ` · ${video.organization.name}` : ""}
              </div>
            </div>
            <Button
              isDisabled={!video.duration}
              size="sm"
              variant="tertiary"
              onPress={() => onPick(toGrantVideo(video))}
            >
              Legg til
            </Button>
          </li>
        ))}
      </ul>
      {!videos.isLoading && results.length === 0 ? <p>Ingen videoer funnet.</p> : null}
    </section>
  );
};
