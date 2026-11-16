import { describe, expect, it } from "vitest";
import { endFromTime, startFromTime, timesWarnings } from "./GrantTimesControl";

describe("the times staff type", () => {
  const grant = { starttime: "2026-11-16T12:00:00Z" }; // 13:00 Oslo

  it("puts the end on the grant's day in Oslo", () => {
    expect(Date.parse(endFromTime(grant, "15:00")!)).toBe(Date.parse("2026-11-16T14:00:00Z"));
  });

  it("puts the end on the next day for a time before the start", () => {
    expect(Date.parse(endFromTime(grant, "00:30")!)).toBe(Date.parse("2026-11-16T23:30:00Z"));
  });

  it("puts the start on the grant's day", () => {
    expect(Date.parse(startFromTime(grant, "12:30")!)).toBe(Date.parse("2026-11-16T11:30:00Z"));
  });

  it("refuses what isn't a time", () => {
    expect(endFromTime(grant, "")).toBeUndefined();
    expect(startFromTime(grant, "x")).toBeUndefined();
  });
});

describe("warnings for moving the times", () => {
  const now = Date.parse("2026-11-16T12:00:00Z");
  const at = (minutes: number) => new Date(now + minutes * 60_000);

  it("says nothing for changes well ahead", () => {
    expect(timesWarnings({ start: at(30), end: at(90), moveStart: true, now })).toEqual([]);
  });

  it("warns about a start under two minutes away", () => {
    expect(timesWarnings({ start: at(1), end: at(60), moveStart: true, now })).toHaveLength(1);
  });

  it("warns that a start that has passed means now", () => {
    expect(timesWarnings({ start: at(-5), end: at(60), moveStart: true, now })).toEqual([
      "Sendetiden starter da med en gang.",
    ]);
  });

  it("warns about cutting what is on air", () => {
    const onAir = { name: "Pegasus", until: at(20) };
    const [warning] = timesWarnings({ start: at(-30), end: at(10), moveStart: false, onAir, now });
    expect(warning).toContain("Pegasus");
  });
});
