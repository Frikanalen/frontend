import { describe, expect, it } from "vitest";
import {
  instantOf,
  placesText,
  shortestGapSeconds,
  statusOf,
  statusText,
  whenOf,
} from "./bulletins";

const now = Date.parse("2026-11-15T12:00:00Z");

describe("bulletins", () => {
  it("reads and writes times on Oslo's clock", () => {
    expect(whenOf("2026-11-20T17:30:00Z")).toEqual({ date: "2026-11-20", minutes: 18 * 60 + 30 });
    expect(Date.parse(instantOf({ date: "2026-11-20", minutes: 18 * 60 + 30 })!)).toBe(
      Date.parse("2026-11-20T17:30:00Z"),
    );
    // Summer time, and a time after midnight in Oslo that is the day before in UTC.
    expect(whenOf("2026-06-30T22:15:00Z")).toEqual({ date: "2026-07-01", minutes: 15 });
    expect(whenOf(null)).toBeNull();
    expect(instantOf(null)).toBeNull();
  });

  it("says where a bulletin is in its life", () => {
    expect(statusOf({ isPublished: false }, now)).toBe("draft");
    expect(statusOf({ isPublished: true }, now)).toBe("showing");
    expect(statusOf({ isPublished: true, startsAt: "2026-11-16T08:00:00Z" }, now)).toBe("waiting");
    expect(statusOf({ isPublished: true, endsAt: "2026-11-15T11:00:00Z" }, now)).toBe("over");
    expect(statusText({ isPublished: true, endsAt: "2026-11-20T17:00:00Z" }, now)).toBe(
      "Vises nå, til 20.11. kl. 18:00",
    );
    expect(statusText({ isPublished: true, startsAt: "2026-11-16T08:00:00Z" }, now)).toBe(
      "Starter 16.11. kl. 09:00",
    );
  });

  it("says where it shows", () => {
    expect(placesText({ onAir: true, onInfographics: true })).toBe(
      "mellom programmer og i infografikken",
    );
    expect(placesText({ onAir: false, onInfographics: true })).toBe("i infografikken");
    expect(placesText({ onAir: false, onInfographics: false })).toBe("ingen steder");
  });

  it("knows the shortest gap a bulletin fits in", () => {
    expect(shortestGapSeconds(12)).toBe(30);
  });
});
