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

/**
 * The last hour as one thin strip for the broadcast monitor, newest at the
 * right, in bars of half a minute: bar height is bitrate, amber is loss
 * that was recovered, red is a break a viewer would notice. Sized in em by
 * its surroundings, with one short line saying the same in words.
 */
export const SignalHistory = ({ history }: { history: readonly Sample[] }) => {
  const bars = useMemo(() => bucketize(history), [history]);
  const drawn = bars.filter((bar) => bar !== null);
  if (drawn.length < 2) return null;
  const { breaks, losses, span } = summarizeHistory(drawn);
  const width = BUCKETS * SLOT;
  const summary =
    breaks === 0 && losses === 0
      ? "ingen brudd"
      : [breaks > 0 ? `${breaks} brudd` : null, losses > 0 ? `${losses} pakketap` : null]
          .filter(Boolean)
          .join(", ");

  return (
    <figure className="space-y-[0.2em]">
      <svg
        aria-hidden
        className="block h-[4em] w-full text-neutral-300"
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
      <figcaption className="text-[0.8em] leading-tight text-neutral-400">
        Siste {span >= WINDOW_MS - 60_000 ? "time" : formatElapsed(span)}: {summary}
      </figcaption>
    </figure>
  );
};
