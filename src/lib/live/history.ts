import type { Signal, SignalSample } from "@/generated/frikanalenDjangoAPI.schemas";
import { signalBitrate } from "./signal";

/**
 * The signal over the last hour, so trouble that comes and goes can be
 * seen at a glance. While a page is open it adds a sample per report from
 * the receiver; the time before that is filled in from the record the
 * server keeps, which is coarser. The receiver counts loss since the
 * connection opened; a sample holds what was added since the one before.
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

/** The timeline shows an hour, in bars of half a minute. */
export const WINDOW_MS = 60 * 60_000;
export const BUCKETS = 120;

/** An hour of reports five seconds apart. */
export const HISTORY_LENGTH = 720;

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

/** The server's record, in the shape of the page's own samples. */
export const recordedSamples = (samples: readonly SignalSample[]): Sample[] =>
  samples.map((sample) => ({ ...sample, at: Date.parse(sample.at) }));

/** The record up to where the page's own, finer samples begin. */
export const mergeHistory = (recorded: readonly Sample[], live: readonly Sample[]): Sample[] =>
  live.length === 0
    ? [...recorded]
    : [...recorded.filter((sample) => sample.at < live[0].at), ...live];

/**
 * The samples as `count` bars of equal time ending at the newest sample,
 * oldest first, so the timeline keeps its scale however many samples
 * there are. A bar holds the worst of its time: losses add up, and one
 * moment without signal makes it a bar without. Time with no samples is
 * null, and draws nothing.
 */
export const bucketize = (
  samples: readonly Sample[],
  windowMs = WINDOW_MS,
  count = BUCKETS,
): (Sample | null)[] => {
  const size = windowMs / count;
  const latest = samples[samples.length - 1];
  if (!latest) return Array.from({ length: count }, () => null);
  // Bars sit on the clock, so they stay put as new samples come in.
  const end = Math.ceil(latest.at / size) * size;
  const groups: Sample[][] = Array.from({ length: count }, () => []);
  for (const sample of samples) {
    // A sample tells of the time up to `at`: on a boundary it belongs before it.
    const index = count - 1 - Math.floor((end - sample.at) / size);
    if (index >= 0 && index < count) groups[index].push(sample);
  }
  return groups.map((group, index) => {
    if (group.length === 0) return null;
    const rates = group.flatMap(({ bitrate }) => (bitrate === null ? [] : [bitrate]));
    return {
      at: end - (count - 1 - index) * size,
      receiving: group.every(({ receiving }) => receiving),
      bitrate: rates.length
        ? Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)
        : null,
      lost: group.reduce((sum, { lost }) => sum + lost, 0),
      dropped: group.reduce((sum, { dropped }) => sum + dropped, 0),
      reconnected: group.some(({ reconnected }) => reconnected),
    };
  });
};

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
