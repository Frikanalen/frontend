import { describe, expect, it } from "vitest";
import { formatAiringDay, splitAirings } from "@/app/video/[videoId]/LiveProgrammeStage";

// 2026-11-17 10:00 in Oslo (UTC+1).
const NOW = Date.parse("2026-11-17T09:00:00Z");

const airing = (id: number, start: string, end: string) => ({
  id,
  starttime: start,
  endtime: end,
});

describe("splitAirings", () => {
  it("puts the airing under way on air and the rest as coming", () => {
    const onAir = airing(1, "2026-11-17T09:30:00+01:00", "2026-11-17T10:30:00+01:00");
    const later = airing(2, "2026-11-18T19:00:00+01:00", "2026-11-18T20:00:00+01:00");
    expect(splitAirings([onAir, later], NOW)).toEqual({ onAir, coming: [later] });
  });

  it("drops an airing that has ended since the page was fetched", () => {
    const over = airing(1, "2026-11-17T08:00:00+01:00", "2026-11-17T09:00:00+01:00");
    expect(splitAirings([over], NOW)).toEqual({ onAir: undefined, coming: [] });
  });
});

describe("formatAiringDay", () => {
  it("says today and tomorrow by Oslo's calendar", () => {
    expect(formatAiringDay("2026-11-17T23:30:00+01:00", NOW)).toBe("i dag");
    expect(formatAiringDay("2026-11-18T00:30:00+01:00", NOW)).toBe("i morgen");
  });

  it("names the weekday and date further out", () => {
    expect(formatAiringDay("2026-11-21T19:00:00+01:00", NOW)).toBe("lørdag 21. november");
  });
});
