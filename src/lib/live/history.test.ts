import type { Signal } from "@/generated/frikanalenDjangoAPI.schemas";
import { describe, expect, it } from "vitest";
import {
  appendSample,
  HISTORY_LENGTH,
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
  it("keeps the last ten minutes", () => {
    let history = [] as ReturnType<typeof appendSample>;
    for (let index = 0; index < HISTORY_LENGTH + 5; index += 1)
      history = appendSample(history, sampleOf(report(index * 5)));
    expect(history).toHaveLength(HISTORY_LENGTH);
    expect(history[0].at).toBe(Date.parse("2026-11-13T10:10:25Z"));
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
