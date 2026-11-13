"use client";
import type { Signal } from "@/generated/frikanalenDjangoAPI.schemas";
import { useLiveSourcesSignalRetrieve } from "@/generated/live-sources/live-sources";
import { describeSignal } from "@/lib/live/signal";
import cx from "classnames";
import { useState } from "react";

const OPEN_INTERVAL_MS = 5_000;
const CLOSED_INTERVAL_MS = 20_000;

/**
 * What the receiver says about a source's signal, asked again every few
 * seconds, with the report before it so a bitrate can be measured between
 * the two. `signal` is undefined until the first answer, and where the
 * receiver cannot be asked.
 */
export const useSignal = (
  sourceId: number,
  { enabled, open }: { enabled: boolean; open: boolean },
) => {
  const query = useLiveSourcesSignalRetrieve(sourceId, {
    query: { enabled, refetchInterval: open ? OPEN_INTERVAL_MS : CLOSED_INTERVAL_MS },
  });
  const latest = query.data?.status === 200 ? query.data.data : undefined;
  const [pair, setPair] = useState<{ current?: Signal; previous?: Signal }>({});
  if (latest && latest.measuredAt !== pair.current?.measuredAt)
    setPair({ current: latest, previous: pair.current });
  const signal = enabled && pair.current?.available ? pair.current : undefined;
  return { signal, previous: pair.previous };
};

const MARK = {
  ok: { sign: "✓", className: "text-brand-green", name: "I orden" },
  warn: { sign: "!", className: "text-warning-700", name: "Bør sjekkes" },
  bad: { sign: "✕", className: "text-danger-700", name: "Feil" },
} as const;

/**
 * The signal as the encoder sends it, line by line, each marked as fine or
 * as something to act on. These come from the receiver, not the preview:
 * the preview is a small copy and looks the same whatever is sent.
 */
export const SignalReport = ({
  signal,
  previous,
  pulled,
}: {
  signal: Signal;
  previous?: Signal;
  pulled: boolean;
}) => {
  if (!signal.receiving)
    return (
      <p className="text-sm text-default-600">
        {pulled
          ? "Vi henter ikke signalet akkurat nå. Det hentes når noen ser på kilden, og like før en sending."
          : "Ingenting kommer inn. Start sendingen i koderen."}
      </p>
    );
  return (
    <dl className="divide-y divide-default-200 border-y border-default-200 text-sm">
      {describeSignal(signal, pulled, previous).map(({ label, value, status, note }) => (
        <div className="grid grid-cols-[1.25rem_1fr] gap-x-1 py-2" key={label}>
          <span aria-hidden className={cx("font-bold", MARK[status].className)}>
            {MARK[status].sign}
          </span>
          <div className="min-w-0">
            <dt className="text-xs text-default-600">
              {label}
              {status === "ok" ? null : <span className="sr-only"> ({MARK[status].name})</span>}
            </dt>
            <dd className="font-medium break-words">{value}</dd>
            {note ? <dd className={cx("text-xs", MARK[status].className)}>{note}</dd> : null}
          </div>
        </div>
      ))}
    </dl>
  );
};
