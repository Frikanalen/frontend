import { describe, expect, it } from "vitest";
import type { RecurringSlot } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  blocksOf,
  describeShape,
  describeSlot,
  durationPayload,
  formatTime,
  moveDay,
  parseDuration,
  parseTime,
  recurrenceLabel,
  sameShape,
  shapesOverlap,
  slotDays,
  slotsMayCollide,
} from "./slots";

const slot = (fields: Partial<RecurringSlot>): RecurringSlot => ({
  id: 1,
  organization: 3,
  organizationName: "NUUG",
  frequency: "weekly",
  interval: 1,
  weekdays: [3],
  monthWeeks: [],
  startTime: "19:00:00",
  duration: "01:00:00",
  startsOn: "2026-01-01",
  endsOn: null,
  recipe: null,
  description: "",
  ...fields,
});

describe("time and duration", () => {
  it("reads and writes wall-clock times", () => {
    expect(parseTime("19:30:00")).toBe(1170);
    expect(formatTime(1170)).toBe("19:30");
    expect(formatTime(24 * 60 + 30)).toBe("00:30");
  });

  it("reads DRF durations, days included", () => {
    expect(parseDuration("01:30:00")).toBe(90);
    expect(parseDuration("1 02:00:00")).toBe(26 * 60);
    expect(durationPayload(90)).toBe("01:30:00");
  });
});

describe("slotDays", () => {
  it("treats a daily slot without weekdays as every day", () => {
    expect(slotDays({ frequency: "daily", weekdays: [] })).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(slotDays({ frequency: "weekly", weekdays: [4, 1] })).toEqual([1, 4]);
  });
});

describe("blocksOf", () => {
  it("splits an occurrence that runs past midnight, Sunday into Monday", () => {
    expect(blocksOf({ days: [6], start: 23 * 60 + 30, duration: 90 })).toEqual([
      { day: 6, column: 6, top: 1410, bottom: 1440, continued: false },
      { day: 6, column: 0, top: 0, bottom: 60, continued: true },
    ]);
  });
});

describe("overlaps", () => {
  it("sees overlaps on a shared day and not back-to-back slots", () => {
    expect(
      shapesOverlap(
        { days: [2], start: 600, duration: 60 },
        { days: [2], start: 630, duration: 60 },
      ),
    ).toBe(true);
    expect(
      shapesOverlap(
        { days: [2], start: 600, duration: 60 },
        { days: [2], start: 660, duration: 60 },
      ),
    ).toBe(false);
    expect(
      shapesOverlap(
        { days: [2], start: 600, duration: 60 },
        { days: [3], start: 600, duration: 60 },
      ),
    ).toBe(false);
  });

  it("sees a Sunday-night slot running into Monday morning", () => {
    expect(
      shapesOverlap(
        { days: [6], start: 1410, duration: 90 },
        { days: [0], start: 30, duration: 30 },
      ),
    ).toBe(true);
  });

  it("ignores slots whose dates never meet", () => {
    const shape = { days: [2], start: 600, duration: 60 };
    expect(
      slotsMayCollide(
        { startsOn: "2026-01-01", endsOn: "2026-02-01" },
        shape,
        { startsOn: "2026-03-01", endsOn: null },
        shape,
      ),
    ).toBe(false);
  });
});

describe("moveDay", () => {
  it("moves the dragged weekday only, and not onto one the slot has", () => {
    expect(moveDay([0, 2, 4], 2, 3)).toEqual([0, 3, 4]);
    expect(moveDay([0, 2, 4], 2, 4)).toBeNull();
  });
});

describe("labels", () => {
  it("names rarer patterns", () => {
    expect(recurrenceLabel({ frequency: "weekly", interval: 1, monthWeeks: [] })).toBeNull();
    expect(recurrenceLabel({ frequency: "weekly", interval: 2, monthWeeks: [] })).toBe(
      "annenhver uke",
    );
    expect(recurrenceLabel({ frequency: "monthly", interval: 1, monthWeeks: [-1, 1] })).toBe(
      "1., siste i hver måned",
    );
  });

  it("describes a slot in Norwegian", () => {
    expect(describeSlot(slot({}))).toBe("Hver torsdag 19:00–20:00");
    expect(describeSlot(slot({ weekdays: [1, 3], interval: 2 }))).toBe(
      "Hver tirsdag og torsdag, annenhver uke 19:00–20:00",
    );
  });
});

describe("describeShape and sameShape", () => {
  it("names the days and the time on the 24-hour clock", () => {
    expect(describeShape({ days: [2], start: 16 * 60, duration: 60 })).toBe("onsdag 16:00–17:00");
    expect(describeShape({ days: [0, 1, 2, 3, 4, 5, 6], start: 23 * 60, duration: 120 })).toBe(
      "hver dag 23:00–01:00",
    );
  });

  it("tells a moved shape from an untouched one", () => {
    const shape = { days: [1], start: 19 * 60, duration: 60 };
    expect(sameShape(shape, { ...shape, days: [1] })).toBe(true);
    expect(sameShape(shape, { ...shape, start: 18 * 60 })).toBe(false);
    expect(sameShape(shape, { ...shape, days: [2] })).toBe(false);
  });
});
