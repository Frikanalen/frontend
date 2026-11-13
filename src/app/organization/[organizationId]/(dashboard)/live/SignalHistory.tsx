"use client";
import { useLiveSourcesSignalHistoryRetrieve } from "@/generated/live-sources/live-sources";
import { formatElapsed } from "@/lib/live/signal";
import {
  bucketize,
  BUCKETS,
  mergeHistory,
  recordedSamples,
  sampleState,
  summarizeHistory,
  WINDOW_MS,
  type Sample,
  type SampleState,
} from "@/lib/live/history";
import { formatBitrate } from "@/lib/live/streamStats";
import { formatOsloTime } from "@/lib/osloTime";
import cx from "classnames";
import { useMemo } from "react";

const HEIGHT = 36;
const SLOT = 4;
// Bars are bitrate against this, so the recommended 6-12 Mbit/s fills most
// of the height and a sagging encoder shows as a dip.
const FULL_SCALE = 12_000_000;

const FILL: Record<SampleState, string> = {
  ok: "fill-current opacity-40",
  loss: "fill-warning",
  break: "fill-danger",
};

/**
 * The last hour of a source's signal: what the server has on record from
 * before this page was opened, then the page's own, finer samples.
 */
export const useSignalHistory = (
  sourceId: number,
  live: readonly Sample[],
  { enabled }: { enabled: boolean },
) => {
  // Asked once: from here on the page keeps its own count.
  const query = useLiveSourcesSignalHistoryRetrieve(
    sourceId,
    { minutes: WINDOW_MS / 60_000 },
    { query: { enabled, staleTime: Infinity, refetchOnWindowFocus: false, retry: false } },
  );
  const recorded = query.data?.status === 200 ? query.data.data.samples : undefined;
  return useMemo(() => mergeHistory(recordedSamples(recorded ?? []), live), [recorded, live]);
};

const describe = (bar: Sample) => {
  const time = formatOsloTime(new Date(bar.at));
  if (!bar.receiving) return `${time}: ingen signal`;
  const parts = [formatBitrate(bar.bitrate)];
  if (bar.reconnected) parts.push("koblet til på nytt");
  if (bar.dropped > 0) parts.push(`${bar.dropped} pakker kom aldri fram`);
  if (bar.lost > 0) parts.push(`${bar.lost} pakker tapt og hentet inn`);
  return `${time}: ${parts.join(", ")}`;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The signal over the last hour, newest at the right, in bars of half a
 * minute: bar height is bitrate, amber is loss that was recovered, red is
 * a break a viewer would notice. Quiet on purpose; the sentence with it
 * says the same in words. `compact` is for the broadcast monitor, where
 * it is sized by its surroundings and keeps to one short line.
 */
export const SignalHistory = ({
  history,
  compact,
}: {
  history: readonly Sample[];
  compact?: boolean;
}) => {
  const bars = useMemo(() => bucketize(history), [history]);
  const drawn = bars.filter((bar) => bar !== null);
  if (drawn.length < 2) return null;
  const { breaks, losses, span } = summarizeHistory(drawn);
  const width = BUCKETS * SLOT;
  const summary =
    breaks === 0 && losses === 0
      ? compact
        ? "ingen brudd"
        : "ingen brudd eller pakketap"
      : [
          breaks > 0 ? plural(breaks, "brudd", "brudd") : null,
          losses > 0
            ? compact
              ? `${losses} pakketap`
              : plural(losses, "periode med pakketap", "perioder med pakketap")
            : null,
        ]
          .filter(Boolean)
          .join(", ");

  return (
    <figure className={compact ? "space-y-[0.2em]" : "space-y-1"}>
      <svg
        aria-hidden
        className={cx(
          "block w-full",
          compact ? "h-[1.6em] text-neutral-300" : "h-9 text-default-700",
        )}
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${HEIGHT}`}
      >
        <line
          className="stroke-current opacity-20"
          vectorEffect="non-scaling-stroke"
          x1={0}
          x2={width}
          y1={HEIGHT - 0.5}
          y2={HEIGHT - 0.5}
        />
        {bars.map((bar, index) => {
          if (!bar) return null;
          const state = sampleState(bar);
          // A break fills the height so it cannot hide as a short bar.
          const share =
            state === "break" ? 1 : Math.min(1, Math.max(0.08, (bar.bitrate ?? 0) / FULL_SCALE));
          return (
            <rect
              className={FILL[state]}
              height={share * HEIGHT}
              key={bar.at}
              width={SLOT - 1}
              x={index * SLOT}
              y={HEIGHT - share * HEIGHT}
            >
              <title>{describe(bar)}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption
        className={cx(
          compact ? "text-[0.7em] leading-tight text-neutral-400" : "text-xs text-default-600",
        )}
      >
        Siste {span >= WINDOW_MS - 60_000 ? "time" : formatElapsed(span)}: {summary}
        {compact ? null : "."}
        {!compact && (breaks > 0 || losses > 0) ? (
          <>
            {" "}
            <span className="whitespace-nowrap">
              <span aria-hidden className="inline-block size-2 bg-warning" /> hentet inn igjen
            </span>{" "}
            <span className="whitespace-nowrap">
              <span aria-hidden className="inline-block size-2 bg-danger" /> synlig brudd
            </span>
          </>
        ) : null}
      </figcaption>
    </figure>
  );
};
