import { describe, expect, it } from "vitest";
import { addDays, blocksBetween, mondayOf, parseWeek, weekNumber } from "./week";

describe("weeks", () => {
  it("finds the Monday of a week", () => {
    expect(mondayOf("2026-11-14")).toBe("2026-11-09");
    expect(mondayOf("2026-11-09")).toBe("2026-11-09");
    expect(mondayOf("2026-11-15")).toBe("2026-11-09");
  });

  it("reads a week from the address, or falls back to this week", () => {
    expect(parseWeek("2026-11-18", "2026-11-14")).toBe("2026-11-16");
    expect(parseWeek("nonsense", "2026-11-14")).toBe("2026-11-09");
    expect(parseWeek(undefined, "2026-11-14")).toBe("2026-11-09");
  });

  it("numbers weeks as ISO 8601 does", () => {
    expect(weekNumber("2026-11-09")).toBe(46);
    expect(weekNumber("2025-12-29")).toBe(1);
  });

  it("moves across months", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});

describe("blocksBetween", () => {
  const monday = "2026-11-09";

  it("draws a grant within one day", () => {
    // 19:00–20:30 Oslo on Wednesday (UTC+1 in November).
    expect(blocksBetween("2026-11-11T18:00:00Z", "2026-11-11T19:30:00Z", monday)).toEqual([
      { day: 2, top: 19 * 60, bottom: 20 * 60 + 30, first: true },
    ]);
  });

  it("carries a grant past midnight into the next day", () => {
    expect(blocksBetween("2026-11-11T22:00:00Z", "2026-11-12T00:00:00Z", monday)).toEqual([
      { day: 2, top: 23 * 60, bottom: 24 * 60, first: true },
      { day: 3, top: 0, bottom: 60, first: false },
    ]);
  });

  it("ends a grant at midnight on the day it started", () => {
    expect(blocksBetween("2026-11-11T22:00:00Z", "2026-11-11T23:00:00Z", monday)).toEqual([
      { day: 2, top: 23 * 60, bottom: 24 * 60, first: true },
    ]);
  });

  it("clips to the week", () => {
    expect(blocksBetween("2026-11-15T22:30:00Z", "2026-11-16T01:00:00Z", monday)).toEqual([
      { day: 6, top: 23 * 60 + 30, bottom: 24 * 60, first: true },
    ]);
  });
});
