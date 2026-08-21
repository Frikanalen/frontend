import { describe, expect, it } from "vitest";
import { isScheduleDuration } from "./duration";

describe("schedule duration", () => {
  it.each(["00:06:29", "00:06:29.290000", "25:00:00.1"])("accepts %s", (duration) => {
    expect(isScheduleDuration(duration)).toBe(true);
  });

  it.each(["6:29", "00:66:00", "00:06:29.1234567"])("rejects %s", (duration) => {
    expect(isScheduleDuration(duration)).toBe(false);
  });
});
