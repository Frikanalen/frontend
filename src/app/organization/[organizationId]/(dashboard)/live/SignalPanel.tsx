"use client";
import type { Signal } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  bucketize,
  sampleState,
  summarizeHistory,
  WINDOW_MS,
  type Sample,
} from "@/lib/live/history";
import {
  bitrateStatus,
  formatElapsed,
  signalBitrate,
  signalSlots,
  type SignalLine,
} from "@/lib/live/signal";
import { formatBitrate } from "@/lib/live/streamStats";
import { formatOsloTime } from "@/lib/osloTime";
import cx from "classnames";
import { useMemo, type ReactNode } from "react";

const HEIGHT = 28;
const SLOT = 4;
// What we recommend at the least: drawn as a line to hold the bars against.
const RECOMMENDED_BITRATE = 6_000_000;

const MARK = {
  ok: { sign: "✓", className: "text-brand-green", name: "I orden" },
  warn: { sign: "!", className: "text-warning-700", name: "Bør sjekkes" },
  bad: { sign: "✕", className: "text-danger-700", name: "Feil" },
} as const;

const count = (value: number) => value.toLocaleString("nb-NO");
const plural = (value: number, one: string, many: string) =>
  `${count(value)} ${value === 1 ? one : many}`;

/** A row's name, with a mark saying whether it is as it should be. */
const RowLabel = ({ label, status }: { label: string; status?: SignalLine["status"] }) => (
  <dt className="flex items-baseline gap-1.5 text-xs font-semibold tracking-wide text-default-600 uppercase">
    <span aria-hidden className={cx("w-3 font-bold", status ? MARK[status].className : "")}>
      {status ? MARK[status].sign : ""}
    </span>
    {label}
    {status && status !== "ok" ? <span className="sr-only"> ({MARK[status].name})</span> : null}
  </dt>
);

type Mark = { share: number; className: string; title: string };

type MarkOf = (_bar: Sample) => Mark | null;

/** One measure over the hour, on the time axis all the tracks share. */
const Track = ({
  bars,
  mark,
  guide,
}: {
  bars: readonly (Sample | null)[];
  mark: MarkOf;
  /** A level to hold the bars against, as a share of the height. */
  guide?: number;
}) => (
  <svg
    aria-hidden
    className="block h-7 w-full text-default-700"
    preserveAspectRatio="none"
    viewBox={`0 0 ${bars.length * SLOT} ${HEIGHT}`}
  >
    <line
      className="stroke-current opacity-20"
      vectorEffect="non-scaling-stroke"
      x1={0}
      x2={bars.length * SLOT}
      y1={HEIGHT - 0.5}
      y2={HEIGHT - 0.5}
    />
    {bars.map((bar, index) => {
      const drawn = bar ? mark(bar) : null;
      if (!bar || !drawn) return null;
      const height = Math.min(1, Math.max(0.08, drawn.share)) * HEIGHT;
      return (
        <rect
          className={drawn.className}
          height={height}
          key={bar.at}
          width={SLOT - 1}
          x={index * SLOT}
          y={HEIGHT - height}
        >
          <title>{`${formatOsloTime(new Date(bar.at))}: ${drawn.title}`}</title>
        </rect>
      );
    })}
    {guide === undefined ? null : (
      <line
        className="stroke-current opacity-50"
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
        x1={0}
        x2={bars.length * SLOT}
        y1={HEIGHT - guide * HEIGHT}
        y2={HEIGHT - guide * HEIGHT}
      />
    )}
  </svg>
);

const NEUTRAL = "fill-current opacity-40";

/** A measure's name, its figure now or over the hour, and its track. */
const Measure = ({
  label,
  status,
  value,
  unit,
  children,
}: {
  label: string;
  status?: SignalLine["status"];
  value: string;
  unit: string;
  children: ReactNode;
}) => (
  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 px-3 py-2 sm:grid-cols-[5.5rem_6.5rem_minmax(0,1fr)]">
    <RowLabel label={label} status={status} />
    <dd className="col-start-2 row-start-1 flex items-baseline gap-1.5 leading-tight sm:block">
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-default-600 sm:block">{unit}</span>
    </dd>
    <dd className="col-span-2 mt-1 sm:col-span-1 sm:mt-0">{children}</dd>
  </div>
);

/**
 * The signal as the encoder sends it, as a status panel: the figures that
 * describe it in fixed, labelled slots, and under them the measures that
 * move, each beside its last hour on one shared time axis, newest at the
 * right. These come from the receiver, not the preview: the preview is a
 * small copy and looks the same whatever is sent.
 */
export const SignalPanel = ({
  signal,
  previous,
  pulled,
  history,
}: {
  signal: Signal;
  previous?: Signal;
  pulled: boolean;
  history: readonly Sample[];
}) => {
  const bars = useMemo(() => bucketize(history), [history]);
  const drawn = bars.filter((bar) => bar !== null);
  const { breaks, span } = summarizeHistory(drawn);
  const lost = drawn.reduce((sum, bar) => sum + bar.lost, 0);
  const top = Math.max(12_000_000, ...drawn.map((bar) => bar.bitrate ?? 0));
  const mostLost = Math.max(10, ...drawn.map((bar) => bar.lost));
  const window = span >= WINDOW_MS - 60_000 ? "siste time" : `siste ${formatElapsed(span)}`;
  const charted = drawn.length > 1;

  return (
    <div className="border border-default-300 bg-background text-sm">
      {signal.receiving ? null : (
        <p className="border-b border-default-300 border-l-4 border-l-danger bg-content1 px-3 py-2">
          {pulled
            ? "Vi henter ikke signalet akkurat nå. Det hentes når noen ser på kilden, og like før en sending."
            : "Ingenting kommer inn. Start sendingen i koderen."}
        </p>
      )}
      <dl className="divide-y divide-default-200">
        {signalSlots(signal, pulled).map(({ label, status, slots }) => (
          <div
            className="grid items-baseline gap-x-3 gap-y-1 px-3 py-2 sm:grid-cols-[5.5rem_minmax(0,1fr)]"
            key={label}
          >
            <RowLabel label={label} status={signal.receiving ? status : undefined} />
            <dd>
              <dl className="grid grid-cols-3 gap-x-3">
                {slots.map((slot) => (
                  <div className="min-w-0" key={slot.label}>
                    <dt className="truncate text-xs text-default-600">{slot.label}</dt>
                    <dd className="truncate font-semibold">{slot.value}</dd>
                  </div>
                ))}
              </dl>
            </dd>
          </div>
        ))}

        <Measure
          label="Bitrate"
          status={signal.receiving ? bitrateStatus(signal, previous) : undefined}
          unit="nå"
          value={signal.receiving ? formatBitrate(signalBitrate(signal, previous)) : "–"}
        >
          <Track
            bars={bars}
            guide={RECOMMENDED_BITRATE / top}
            mark={(bar) =>
              bar.bitrate === null
                ? null
                : {
                    share: bar.bitrate / top,
                    className: NEUTRAL,
                    title: formatBitrate(bar.bitrate),
                  }
            }
          />
        </Measure>

        {signal.srt || lost > 0 ? (
          <Measure
            label="Pakketap"
            status={lost > 0 ? "warn" : "ok"}
            unit={`pakker ${window}`}
            value={count(lost)}
          >
            <Track
              bars={bars}
              mark={(bar) =>
                bar.lost > 0
                  ? {
                      share: bar.lost / mostLost,
                      className: "fill-warning",
                      title: `${plural(bar.lost, "pakke", "pakker")} tapt og hentet inn`,
                    }
                  : null
              }
            />
          </Measure>
        ) : null}

        <Measure
          label="Brudd"
          status={breaks > 0 ? "bad" : "ok"}
          unit={window}
          value={count(breaks)}
        >
          <Track
            bars={bars}
            mark={(bar) =>
              sampleState(bar) === "break"
                ? {
                    share: 1,
                    className: "fill-danger",
                    title: !bar.receiving
                      ? "ingen signal"
                      : bar.dropped > 0
                        ? `${plural(bar.dropped, "pakke", "pakker")} kom aldri fram`
                        : "koblet til på nytt",
                  }
                : { share: 0.2, className: NEUTRAL, title: "signal inne" }
            }
          />
        </Measure>
      </dl>
      {charted ? (
        <p className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 border-t border-default-200 px-3 py-1.5 text-xs text-default-600 sm:grid-cols-[5.5rem_6.5rem_minmax(0,1fr)]">
          <span className="col-span-full flex justify-between sm:col-span-1 sm:col-start-3">
            <span>for 60 min siden</span>
            <span>nå</span>
          </span>
        </p>
      ) : null}
      <p className="border-t border-default-200 px-3 py-2 text-xs text-default-600">
        Stiplet linje: anbefalt minste bitrate, 6 Mbit/s. Pakketap er pakker som ble borte på veien
        og hentet inn igjen. Brudd er det seerne ville merket: pakker som aldri kom fram, ny
        tilkobling eller ikke noe signal.
      </p>
    </div>
  );
};
