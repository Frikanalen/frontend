import { describe, expect, it } from "vitest";
import { formatBitrate, summarizeStats } from "./streamStats";

const report = (entries: Record<string, unknown>[]) =>
  new Map(entries.map((entry) => [entry.id as string, entry])) as unknown as RTCStatsReport;

const video = (bytesReceived: number, timestamp: number) => ({
  id: "v",
  type: "inbound-rtp",
  kind: "video",
  timestamp,
  bytesReceived,
  packetsLost: 2,
  codecId: "c1",
  frameWidth: 1280,
  frameHeight: 720,
  framesPerSecond: 50,
});

const codec = { id: "c1", type: "codec", mimeType: "video/H264" };

describe("summarizeStats", () => {
  it("has no bitrate until there is a previous sample to compare with", () => {
    const first = summarizeStats(report([video(1000, 1000), codec]));
    expect(first.video).toMatchObject({
      bitrate: null,
      codec: "H264",
      width: 1280,
      height: 720,
      framesPerSecond: 50,
      packetsLost: 2,
    });
    expect(first.audio).toBeNull();
  });

  it("computes bits per second between samples", () => {
    const first = summarizeStats(report([video(1000, 1000)]));
    // 250 000 bytes over half a second is four megabits a second.
    const second = summarizeStats(report([video(251_000, 1500)]), first.samples);
    expect(second.video?.bitrate).toBe(4_000_000);
  });

  it("reports audio level and ignores counters that went backwards", () => {
    const audio = (bytesReceived: number, timestamp: number) => ({
      id: "a",
      type: "inbound-rtp",
      kind: "audio",
      timestamp,
      bytesReceived,
      audioLevel: 0.5,
    });
    const first = summarizeStats(report([audio(5000, 1000)]));
    const reset = summarizeStats(report([audio(10, 2000)]), first.samples);
    expect(reset.audio).toMatchObject({ bitrate: null, level: 0.5, codec: null });
  });
});

describe("formatBitrate", () => {
  it("uses kbit/s below a megabit and Mbit/s above", () => {
    expect(formatBitrate(null)).toBe("–");
    expect(formatBitrate(96_000)).toBe("96 kbit/s");
    expect(formatBitrate(4_500_000)).toBe("4,5 Mbit/s");
  });
});
