import type { Signal } from "@/generated/frikanalenDjangoAPI.schemas";
import { describe, expect, it } from "vitest";
import {
  appendSample,
  bucketize,
  HISTORY_LENGTH,
  mergeHistory,
  recordedSamples,
  recentlyBroken,
  sampleOf,
  sampleState,
  summarizeHistory,
} from "./history";

const report = (
  second: number,
  overrides: Partial<Signal> = {},
  lost = 0,
  dropped = 0,
): Signal => ({
  available: true,
  receiving: true,
  since: "2026-11-13T10:00:00Z",
  protocol: "SRT",
  bytesReceived: second * 1_000_000,
  srt: {
    packetsReceived: second * 700,
    packetsLost: lost,
    packetsRetransmitted: lost,
    packetsDropped: dropped,
    roundTripMs: 20,
  },
  measuredAt: new Date(Date.parse("2026-11-13T10:10:00Z") + second * 1000).toISOString(),
  ...overrides,
});

describe("sampleOf", () => {
  it("holds what was added since the report before", () => {
    const sample = sampleOf(report(5, {}, 30, 2), report(0, {}, 10, 0));
    expect(sample).toMatchObject({ bitrate: 8_000_000, lost: 20, dropped: 2, reconnected: false });
    expect(sampleState(sample)).toBe("break");
    expect(sampleState(sampleOf(report(5, {}, 30), report(0, {}, 10)))).toBe("loss");
    expect(sampleState(sampleOf(report(5, {}, 10), report(0, {}, 10)))).toBe("ok");
  });

  it("does not count old loss as news on the first report", () => {
    expect(sampleOf(report(5, {}, 400, 9))).toMatchObject({ lost: 0, dropped: 0 });
  });

  it("marks a reconnect, and starts counting from the new connection", () => {
    const again = report(10, { since: "2026-11-13T10:10:08Z" }, 3, 0);
    const sample = sampleOf(again, report(5, {}, 400, 0));
    expect(sample).toMatchObject({ reconnected: true, lost: 0 });
    expect(sampleState(sample)).toBe("break");
  });

  it("is a break while nothing arrives", () => {
    const sample = sampleOf(report(5, { receiving: false }), report(0));
    expect(sample).toMatchObject({ receiving: false, bitrate: null });
    expect(sampleState(sample)).toBe("break");
  });
});

describe("history", () => {
  it("keeps the last hour", () => {
    let history = [] as ReturnType<typeof appendSample>;
    for (let index = 0; index < HISTORY_LENGTH + 5; index += 1)
      history = appendSample(history, sampleOf(report(index * 5)));
    expect(history).toHaveLength(HISTORY_LENGTH);
    expect(history[0].at).toBe(Date.parse("2026-11-13T10:10:25Z"));
    expect(history[HISTORY_LENGTH - 1].at - history[0].at).toBeLessThan(3_600_000);
  });

  it("counts a bad patch once however long it lasts", () => {
    const states = ["ok", "loss", "loss", "ok", "break", "break", "break", "ok", "loss"];
    const history = states.map((state, index) => ({
      at: index * 5000,
      receiving: true,
      bitrate: 8_000_000,
      lost: state === "loss" ? 4 : 0,
      dropped: state === "break" ? 1 : 0,
      reconnected: false,
    }));
    expect(summarizeHistory(history)).toEqual({ breaks: 1, losses: 2, span: 40_000 });
    // The break ended 10 s before the newest sample; a minute on it is old.
    expect(recentlyBroken(history)).toBe(true);
    const later = { ...history[8], at: 120_000, lost: 0 };
    expect(recentlyBroken([...history, later])).toBe(false);
    expect(recentlyBroken([])).toBe(false);
  });
});

describe("timeline", () => {
  const sample = (at: number, overrides = {}) => ({
    at,
    receiving: true,
    bitrate: 8_000_000,
    lost: 0,
    dropped: 0,
    reconnected: false,
    ...overrides,
  });

  it("reads the server's record, and lets the page's own samples take over", () => {
    const recorded = recordedSamples([
      { ...sample(0), at: "2026-11-13T10:00:00Z" },
      { ...sample(0), at: "2026-11-13T10:00:30Z" },
      { ...sample(0), at: "2026-11-13T10:01:00Z" },
    ]);
    expect(recorded[1].at).toBe(Date.parse("2026-11-13T10:00:30Z"));
    const live = [sample(Date.parse("2026-11-13T10:00:42Z"))];
    expect(mergeHistory(recorded, live).map(({ at }) => at)).toEqual([
      recorded[0].at,
      recorded[1].at,
      live[0].at,
    ]);
    expect(mergeHistory(recorded, [])).toEqual(recorded);
  });

  it("puts samples in bars on the clock, newest last, and leaves quiet time empty", () => {
    // Four bars of 30 s; the newest sample is at 100 s, so the bars end at 120 s.
    const bars = bucketize(
      [
        sample(30_000, { bitrate: 4_000_000 }),
        sample(65_000, { bitrate: 6_000_000, lost: 2 }),
        sample(70_000, { bitrate: 8_000_000, lost: 3 }),
        sample(100_000, { bitrate: null }),
      ],
      120_000,
      4,
    );
    expect(bars.map((bar) => bar?.at ?? null)).toEqual([30_000, null, 90_000, 120_000]);
    expect(bars[2]).toMatchObject({ bitrate: 7_000_000, lost: 5, receiving: true });
    expect(bars[3]?.bitrate).toBeNull();
  });

  it("shows the worst of a bar's time, and drops what is older than the window", () => {
    const bars = bucketize(
      [
        sample(-500_000, { dropped: 9 }),
        sample(95_000),
        sample(100_000, { receiving: false, bitrate: null }),
        sample(105_000, { reconnected: true }),
      ],
      120_000,
      4,
    );
    expect(bars.slice(0, 3)).toEqual([null, null, null]);
    expect(bars[3]).toMatchObject({ receiving: false, reconnected: true, dropped: 0 });
    expect(sampleState(bars[3]!)).toBe("break");
    expect(bucketize([], 120_000, 4)).toEqual([null, null, null, null]);
  });
});
