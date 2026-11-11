import { describe, expect, it } from "vitest";
import { durationMilliseconds, formatDuration } from "./duration";

describe("durationMilliseconds", () => {
  it("parses Django durations, including days and microseconds", () => {
    expect(durationMilliseconds("1 02:03:04.500000")).toBe(93_784_500);
  });

  it("rejects malformed durations", () => {
    expect(durationMilliseconds("not a duration")).toBeUndefined();
  });
});

describe("formatDuration", () => {
  it.each([
    [249_900, "4:09"],
    [3_900_000, "1:05:00"],
    [0, "0:00"],
    [-5, "0:00"],
  ])("formats %d ms as %s", (milliseconds, expected) => {
    expect(formatDuration(milliseconds)).toBe(expected);
  });
});
