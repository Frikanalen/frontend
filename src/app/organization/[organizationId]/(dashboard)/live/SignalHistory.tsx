"use client";
import { formatElapsed } from "@/lib/live/signal";
import {
  HISTORY_LENGTH,
  sampleState,
  summarizeHistory,
  type Sample,
  type SampleState,
} from "@/lib/live/history";
import { formatBitrate } from "@/lib/live/streamStats";
import { formatOsloTime } from "@/lib/osloTime";
import cx from "classnames";

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

const describe = (sample: Sample) => {
  const time = formatOsloTime(new Date(sample.at));
  if (!sample.receiving) return `${time}: ingen signal`;
  const parts = [formatBitrate(sample.bitrate)];
  if (sample.reconnected) parts.push("koblet til på nytt");
  if (sample.dropped > 0) parts.push(`${sample.dropped} pakker kom aldri fram`);
  if (sample.lost > 0) parts.push(`${sample.lost} pakker tapt og hentet inn`);
  return `${time}: ${parts.join(", ")}`;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The signal while this page has been open, newest at the right: bar
 * height is bitrate, amber is loss that was recovered, red is a break a
 * viewer would notice. Quiet on purpose; the sentence under it says the
 * same in words.
 */
export const SignalHistory = ({
  history,
  dark,
}: {
  history: readonly Sample[];
  dark?: boolean;
}) => {
  if (history.length < 2) return null;
  const { breaks, losses, span } = summarizeHistory(history);
  const width = HISTORY_LENGTH * SLOT;
  const offset = HISTORY_LENGTH - history.length;
  const summary =
    breaks === 0 && losses === 0
      ? "ingen brudd eller pakketap"
      : [
          breaks > 0 ? plural(breaks, "brudd", "brudd") : null,
          losses > 0 ? plural(losses, "periode med pakketap", "perioder med pakketap") : null,
        ]
          .filter(Boolean)
          .join(", ");

  return (
    <figure className="space-y-1">
      <svg
        aria-hidden
        className={cx("block h-9 w-full", dark ? "text-neutral-300" : "text-default-700")}
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
        {history.map((sample, index) => {
          const state = sampleState(sample);
          // A break fills the height so it cannot hide as a short bar.
          const share =
            state === "break" ? 1 : Math.min(1, Math.max(0.08, (sample.bitrate ?? 0) / FULL_SCALE));
          return (
            <rect
              className={FILL[state]}
              height={share * HEIGHT}
              key={sample.at}
              width={SLOT - 1}
              x={(offset + index) * SLOT}
              y={HEIGHT - share * HEIGHT}
            >
              <title>{describe(sample)}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className={cx("text-xs", dark ? "text-neutral-400" : "text-default-600")}>
        Siste {formatElapsed(span)} på denne siden: {summary}.
        {breaks > 0 || losses > 0 ? (
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
