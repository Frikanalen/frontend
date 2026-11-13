import type { Signal } from "@/generated/frikanalenDjangoAPI.schemas";
import { signalBitrate } from "./signal";

/**
 * The signal over the time a page has been open, one sample per report
 * from the receiver, so trouble that comes and goes can be seen at a
 * glance. The receiver counts loss since the connection opened; a sample
 * holds what was added since the report before.
 */
export type Sample = {
  at: number;
  receiving: boolean;
  bitrate: number | null;
  /** Packets lost on the way and asked for again (SRT). */
  lost: number;
  /** Packets that never arrived in time: a visible glitch. */
  dropped: number;
  /** The encoder connected anew since the report before. */
  reconnected: boolean;
};

/** Ten minutes of reports five seconds apart. */
export const HISTORY_LENGTH = 120;

export const sampleOf = (signal: Signal, previous?: Signal): Sample => {
  const at = Date.parse(signal.measuredAt);
  if (!signal.receiving)
    return { at, receiving: false, bitrate: null, lost: 0, dropped: 0, reconnected: false };
  const same = previous?.receiving === true && previous.since === signal.since;
  const before = same ? previous?.srt : undefined;
  return {
    at,
    receiving: true,
    bitrate: signalBitrate(signal, previous),
    // Counters start over with a new connection, and the first report of
    // a page has nothing to compare with: neither is news.
    lost: before ? Math.max(0, (signal.srt?.packetsLost ?? 0) - before.packetsLost) : 0,
    dropped: before ? Math.max(0, (signal.srt?.packetsDropped ?? 0) - before.packetsDropped) : 0,
    reconnected: previous?.receiving === true && !same,
  };
};

export const appendSample = (history: readonly Sample[], sample: Sample): Sample[] =>
  [...history, sample].slice(-HISTORY_LENGTH);

export type SampleState = "ok" | "loss" | "break";

/** A break is anything a viewer would notice; loss was recovered. */
export const sampleState = (sample: Sample): SampleState =>
  !sample.receiving || sample.dropped > 0 || sample.reconnected
    ? "break"
    : sample.lost > 0
      ? "loss"
      : "ok";

/** Runs of consecutive samples in a state count once: one bad patch. */
const episodes = (history: readonly Sample[], state: SampleState) =>
  history.filter(
    (sample, index) =>
      sampleState(sample) === state && (index === 0 || sampleState(history[index - 1]) !== state),
  ).length;

export const summarizeHistory = (history: readonly Sample[]) => ({
  breaks: episodes(history, "break"),
  losses: episodes(history, "loss"),
  span: history.length > 1 ? history[history.length - 1].at - history[0].at : 0,
});

/** Whether anything a viewer would notice happened in the last minute. */
export const recentlyBroken = (history: readonly Sample[], withinMs = 60_000) => {
  const latest = history[history.length - 1];
  return (
    latest !== undefined &&
    history.some(
      (sample) =>
        latest.at - sample.at <= withinMs && sample.receiving && sampleState(sample) === "break",
    )
  );
};
