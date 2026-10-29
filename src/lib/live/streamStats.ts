/**
 * What a member checking their feed wants to know, read off the browser's
 * own WebRTC statistics: is anything arriving, at what rate, and is there
 * sound.
 */

type Sample = { bytes: number; timestamp: number };

export type TrackStats = {
  /** Bits per second since the previous sample; null on the first one. */
  bitrate: number | null;
  packetsLost: number;
};

export type VideoStats = TrackStats & {
  codec: string | null;
  width: number | null;
  height: number | null;
  framesPerSecond: number | null;
};

export type AudioStats = TrackStats & {
  codec: string | null;
  /** 0..1, as the browser reports it; null where it does not. */
  level: number | null;
};

export type StreamStats = {
  video: VideoStats | null;
  audio: AudioStats | null;
  /** Raw counters to pass back in with the next report. */
  samples: Partial<Record<"video" | "audio", Sample>>;
};

type InboundRtp = {
  type: "inbound-rtp";
  kind: "video" | "audio";
  timestamp: number;
  bytesReceived?: number;
  packetsLost?: number;
  codecId?: string;
  frameWidth?: number;
  frameHeight?: number;
  framesPerSecond?: number;
  audioLevel?: number;
};

const bitrate = (now: Sample, before: Sample | undefined) => {
  if (!before || now.timestamp <= before.timestamp || now.bytes < before.bytes) return null;
  return ((now.bytes - before.bytes) * 8 * 1000) / (now.timestamp - before.timestamp);
};

export function summarizeStats(
  report: RTCStatsReport,
  previous: StreamStats["samples"] = {},
): StreamStats {
  const result: StreamStats = { video: null, audio: null, samples: {} };
  const codecName = (id: string | undefined) => {
    const codec = id ? report.get(id) : undefined;
    return codec?.mimeType ? String(codec.mimeType).replace(/^(video|audio)\//, "") : null;
  };

  report.forEach((entry) => {
    if (entry.type !== "inbound-rtp") return;
    const rtp = entry as InboundRtp;
    const sample = { bytes: rtp.bytesReceived ?? 0, timestamp: rtp.timestamp };
    result.samples[rtp.kind] = sample;
    const common = {
      bitrate: bitrate(sample, previous[rtp.kind]),
      packetsLost: rtp.packetsLost ?? 0,
      codec: codecName(rtp.codecId),
    };
    if (rtp.kind === "video")
      result.video = {
        ...common,
        width: rtp.frameWidth ?? null,
        height: rtp.frameHeight ?? null,
        framesPerSecond: rtp.framesPerSecond ?? null,
      };
    else result.audio = { ...common, level: rtp.audioLevel ?? null };
  });

  return result;
}

export const formatBitrate = (bitsPerSecond: number | null) => {
  if (bitsPerSecond === null) return "–";
  if (bitsPerSecond >= 1_000_000)
    return `${(bitsPerSecond / 1_000_000).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} Mbit/s`;
  return `${Math.round(bitsPerSecond / 1000).toLocaleString("nb-NO")} kbit/s`;
};
