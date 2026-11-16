import { describe, expect, it } from "vitest";
import { closeCallWarning, cutWarning } from "./OnAirConfirm";

const now = Date.parse("2026-11-16T14:00:00Z"); // 15:00 Oslo

describe("warnings before changing what is on air", () => {
  it("warns about a change to something starting within two minutes", () => {
    expect(closeCallWarning(new Date(now + 90_000), now)).toContain("15:01:30");
    expect(closeCallWarning(new Date(now + 5 * 60_000), now)).toBeUndefined();
    expect(closeCallWarning(undefined, now)).toBeUndefined();
  });

  it("says when the programme on air is cut", () => {
    expect(cutWarning("Nyheter", new Date(now), now)).toContain("med en gang");
    expect(cutWarning("Nyheter", new Date(now + 10 * 60_000), now)).toContain("kl. 15:10");
  });
});
