"use client";
import type { Signal } from "@/generated/frikanalenDjangoAPI.schemas";
import { useLiveSourcesSignalRetrieve } from "@/generated/live-sources/live-sources";
import { appendSample, sampleOf, type Sample } from "@/lib/live/history";
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
  const [history, setHistory] = useState<readonly Sample[]>([]);
  if (latest && latest.measuredAt !== pair.current?.measuredAt) {
    setPair({ current: latest, previous: pair.current });
    if (latest.available) setHistory(appendSample(history, sampleOf(latest, pair.current)));
  }
  const signal = enabled && pair.current?.available ? pair.current : undefined;
  // How far this computer's clock is from the server's, as of the last
  // report: what a countdown to air should be corrected by.
  const clockOffset =
    latest && query.dataUpdatedAt ? Date.parse(latest.measuredAt) - query.dataUpdatedAt : 0;
  return { signal, previous: pair.previous, clockOffset, history };
};
