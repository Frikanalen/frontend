"use client";
import { durationMilliseconds, formatDuration } from "@/app/grants/duration";
import type { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosList } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import cx from "classnames";
import { useState } from "react";

const fieldClass = "w-full rounded-lg border border-default-300 bg-background px-3 py-2";

/**
 * One of an organization's videos, newest first, searchable. Videos still
 * waiting for their file can be chosen too, as long as their length is set.
 */
export const VideoChooser = ({
  organizationId,
  selected,
  onSelect,
  room,
}: {
  organizationId: number;
  selected?: number;
  onSelect: (_video: Video) => void;
  /** Milliseconds available, so each video can say whether it fits. */
  room?: number;
}) => {
  const [search, setSearch] = useState("");
  const [waiting, setWaiting] = useState(false);
  const videos = useVideosList({
    organization: organizationId,
    proper_import: waiting ? false : undefined,
    q: search || undefined,
    ordering: "-created_time",
    limit: 30,
  });
  const results = (videos.data?.data.results ?? []).filter((video) => video.duration);

  return (
    <div className="space-y-2">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Søk i organisasjonens videoer
        <input
          className={fieldClass}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          checked={waiting}
          type="checkbox"
          onChange={(event) => setWaiting(event.target.checked)}
        />
        Vis videoer som venter på fil
      </label>
      {videos.isError ? <p role="alert">{formatApiError(videos.error)}</p> : null}
      <ul
        aria-label="Videoer"
        className="max-h-64 divide-y divide-default-100 overflow-y-auto border-y border-default-200"
      >
        {videos.isLoading ? <li className="p-2 text-sm">Laster videoer…</li> : null}
        {videos.isSuccess && results.length === 0 ? (
          <li className="p-2 text-sm">Ingen videoer funnet.</li>
        ) : null}
        {results.map((video) => {
          const length = durationMilliseconds(video.duration ?? "") ?? 0;
          const tooLong = room !== undefined && length > room;
          return (
            <li key={video.id}>
              <button
                aria-pressed={selected === video.id}
                className={cx(
                  "flex w-full flex-col px-2 py-1.5 text-left text-sm hover:bg-default-100",
                  selected === video.id && "bg-accent/15 font-semibold",
                )}
                type="button"
                onClick={() => onSelect(video)}
              >
                <span className="truncate">{video.name}</span>
                <span className="text-xs text-default-600">
                  {formatDuration(length)}
                  {video.properImport ? "" : " · venter på fil"}
                  {tooLong ? " · får ikke plass" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
