import type { Signal } from "@/generated/frikanalenDjangoAPI.schemas";
import { describe, expect, it } from "vitest";
import { describeSignal, formatElapsed, readiness, signalBitrate } from "./signal";

const good: Signal = {
  available: true,
  receiving: true,
  since: "2026-11-13T10:00:00Z",
  protocol: "SRT",
  video: { codec: "H264", width: 1920, height: 1080, profile: "High" },
  audio: { codec: "MPEG-4 Audio", sampleRate: 48000, channelCount: 2 },
  bytesReceived: 720_000_000,
  framesInError: 0,
  srt: {
    packetsReceived: 100_000,
    packetsLost: 0,
    packetsRetransmitted: 0,
    packetsDropped: 0,
    roundTripMs: 23.6,
  },
  measuredAt: "2026-11-13T10:12:00Z",
};

const line = (signal: Signal, label: string, previous?: Signal) =>
  describeSignal(signal, false, previous).find((entry) => entry.label === label);

describe("describeSignal", () => {
  it("describes a signal as recommended without flagging anything", () => {
    const lines = describeSignal(good, false);
    expect(lines.map(({ label, value }) => [label, value])).toEqual([
      ["Mottak", "SRT · inne i 12 min"],
      ["Bilde", "1920×1080 · H.264 High"],
      ["Lyd", "AAC · 48 kHz · stereo"],
      ["Bitrate", "8 Mbit/s"],
      ["Pakketap", "Ingen"],
      ["Rundetid til oss", "24 ms"],
    ]);
    expect(lines.every(({ status }) => status === "ok")).toBe(true);
  });

  it("does not name the relay's protocol for a pulled source", () => {
    expect(describeSignal({ ...good, protocol: "", srt: null }, true)[0].value).toBe(
      "Hentet av Frikanalen · inne i 12 min",
    );
  });

  it("flags a codec we cannot air, a small picture and missing sound", () => {
    expect(line({ ...good, video: { ...good.video!, codec: "H265" } }, "Bilde")).toMatchObject({
      value: "1920×1080 · HEVC High",
      status: "bad",
    });
    expect(
      line({ ...good, video: { ...good.video!, width: 1280, height: 720 } }, "Bilde"),
    ).toMatchObject({ status: "warn" });
    expect(line({ ...good, audio: null }, "Lyd")).toMatchObject({
      value: "Ingen lyd",
      status: "bad",
    });
    expect(
      line(
        { ...good, audio: { codec: "MPEG-4 Audio", sampleRate: 44100, channelCount: 1 } },
        "Lyd",
      ),
    ).toMatchObject({ value: "AAC · 44,1 kHz · mono", status: "warn" });
  });

  it("flags a bitrate well off the recommendation", () => {
    expect(line({ ...good, bytesReceived: 90_000_000 }, "Bitrate")).toMatchObject({
      value: "1 Mbit/s",
      status: "warn",
    });
    expect(line({ ...good, bytesReceived: 1_800_000_000 }, "Bitrate")?.status).toBe("warn");
  });

  it("tells recovered loss from loss a viewer sees", () => {
    const srt = { ...good.srt!, packetsLost: 2_500 };
    expect(line({ ...good, srt }, "Pakketap")).toMatchObject({
      // nb-NO groups thousands with a no-break space.
      value: expect.stringMatching(/^2,44 % \(2\s500 pakker\)$/),
      status: "warn",
    });
    expect(line({ ...good, srt: { ...srt, packetsDropped: 7 } }, "Pakketap")?.status).toBe("bad");
    expect(line({ ...good, srt: { ...good.srt!, packetsLost: 3 } }, "Pakketap")).toMatchObject({
      value: "under 0,01 % (3 pakker)",
      status: "ok",
    });
    expect(line({ ...good, framesInError: 4 }, "Feil i signalet")?.status).toBe("warn");
  });
});

describe("signalBitrate", () => {
  it("measures between two reports of the same connection", () => {
    const next = { ...good, bytesReceived: 725_000_000, measuredAt: "2026-11-13T10:12:05Z" };
    expect(signalBitrate(next, good)).toBe(8_000_000);
  });

  it("falls back to the average after a reconnect, and waits for one to exist", () => {
    const reconnected = {
      ...good,
      since: "2026-11-13T10:12:04Z",
      bytesReceived: 1_000_000,
      measuredAt: "2026-11-13T10:12:05Z",
    };
    expect(signalBitrate(reconnected, good)).toBeNull();
    expect(signalBitrate({ ...reconnected, measuredAt: "2026-11-13T10:12:08Z" }, good)).toBe(
      2_000_000,
    );
  });
});

describe("formatElapsed", () => {
  it("is short at every scale", () => {
    expect(formatElapsed(20_000)).toBe("under 1 min");
    expect(formatElapsed(125 * 60_000)).toBe("2 t 5 min");
    expect(formatElapsed(50 * 3_600_000)).toBe("2 d 2 t");
  });
});

describe("readiness", () => {
  const ask = (signal: Signal | undefined, silent = false) =>
    readiness({ signal, pulled: false, silent });

  it("waits while nothing arrives or nothing is known", () => {
    expect(ask(undefined).level).toBe("waiting");
    expect(ask({ ...good, receiving: false }).level).toBe("waiting");
  });

  it("is ready when every line is fine and sound is heard", () => {
    expect(ask(good)).toEqual({ level: "ready", reasons: [] });
  });

  it("asks for a look at warnings and at a silent sound track", () => {
    const small = { ...good, video: { ...good.video!, width: 1280, height: 720 } };
    expect(ask(small).level).toBe("check");
    expect(ask(good, true)).toMatchObject({
      level: "check",
      reasons: [expect.stringContaining("stille")],
    });
  });

  it("is a problem when something will not air, listed first", () => {
    const result = ask({ ...good, audio: null, bytesReceived: 90_000_000 });
    expect(result.level).toBe("problem");
    expect(result.reasons[0]).toMatch(/^Lyd:/);
    expect(result.reasons[1]).toMatch(/^Bitrate:/);
  });
});
