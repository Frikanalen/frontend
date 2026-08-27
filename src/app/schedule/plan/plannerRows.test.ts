import { describe, expect, it } from "vitest";
import type { ScheduleitemRead, WeeklySlotRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { openDates, osloDateTime, plannerItemBounds, plannerRows } from "./plannerRows";

const item = (id: number, starttime: string, endtime: string): ScheduleitemRead => ({
  id,
  defaultName: "Program",
  video: null,
  schedulereason: 2,
  starttime,
  endtime,
  duration: "01:00:00",
  displaceable: false,
  weeklySlot: null,
});

const slot = (overrides: Partial<WeeklySlotRead> = {}): WeeklySlotRead => ({
  id: 7,
  organization: null,
  source: { id: 3, name: "Fast ukesending" },
  day: 4,
  startTime: "12:00:00",
  duration: "01:00:00",
  ...overrides,
});

describe("plannerRows", () => {
  it("uses Oslo wall time when constructing a broadcast instant", () => {
    expect(osloDateTime("2026-08-21", "20:30").toISOString()).toBe("2026-08-21T20:30:00.000+02:00");
  });

  it("lists every date in the server's open scheduling window", () => {
    expect(openDates("2026-08-17T00:00:00+02:00", "2026-08-24T00:00:00+02:00")).toEqual([
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
  });

  it("clamps a programme crossing midnight to the selected day's lower bound", () => {
    const crossingMidnight = item(1, "2026-08-20T23:55:00+02:00", "2026-08-21T00:25:00+02:00");

    const bounds = plannerItemBounds(crossingMidnight, "2026-08-21");

    expect(bounds.start.toISOString()).toBe("2026-08-20T22:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-08-20T22:25:00.000Z");
  });

  it("turns unoccupied airtime into selectable gaps", () => {
    const rows = plannerRows(
      [item(1, "2026-08-21T10:00:00+02:00", "2026-08-21T11:00:00+02:00")],
      [],
      "2026-08-21",
    );

    expect(rows.map((row) => row.kind)).toEqual(["gap", "item", "gap"]);
    expect(rows[0].kind === "gap" && rows[0].end.toISOString()).toBe("2026-08-21T08:00:00.000Z");
  });

  it("does not offer gaps shorter than ten minutes", () => {
    const rows = plannerRows(
      [
        item(1, "2026-08-21T00:09:00+02:00", "2026-08-21T00:20:00+02:00"),
        item(2, "2026-08-21T00:30:00+02:00", "2026-08-21T01:00:00+02:00"),
      ],
      [],
      "2026-08-21",
    );

    expect(rows.slice(0, 3).map((row) => row.kind)).toEqual(["item", "gap", "item"]);
    expect(rows[1].kind === "gap" && rows[1].start.toISOString()).toBe("2026-08-20T22:20:00.000Z");
  });

  it("renders an unmaterialized weekly slot as reserved airtime", () => {
    const rows = plannerRows([], [slot()], "2026-08-21");

    expect(rows.map((row) => row.kind)).toEqual(["gap", "weeklySlot", "gap"]);
    expect(rows[1].kind === "weeklySlot" && rows[1].start.toISOString()).toBe(
      "2026-08-21T12:00:00.000+02:00",
    );
  });

  it("nests the programmes a weekly slot has been filled with", () => {
    const first = {
      ...item(1, "2026-08-21T12:00:00+02:00", "2026-08-21T12:30:00+02:00"),
      weeklySlot: 7,
    };
    const second = {
      ...item(2, "2026-08-21T12:30:00+02:00", "2026-08-21T13:00:00+02:00"),
      weeklySlot: 7,
    };

    const rows = plannerRows([second, first], [slot()], "2026-08-21");

    expect(rows.map((row) => row.kind)).toEqual(["gap", "weeklySlot", "gap"]);
    expect(rows[1].kind === "weeklySlot" && rows[1].items.map(({ id }) => id)).toEqual([1, 2]);
  });

  it("covers programming that overruns its weekly slot", () => {
    const overrunning = {
      ...item(1, "2026-08-21T12:00:00+02:00", "2026-08-21T13:30:00+02:00"),
      weeklySlot: 7,
    };

    const rows = plannerRows([overrunning], [slot()], "2026-08-21");

    expect(rows.map((row) => row.kind)).toEqual(["gap", "weeklySlot", "gap"]);
    expect(rows[1].kind === "weeklySlot" && rows[1].end.toISOString()).toBe(
      "2026-08-21T11:30:00.000Z",
    );
    expect(rows[2].kind === "gap" && rows[2].start.toISOString()).toBe("2026-08-21T11:30:00.000Z");
  });

  it("keeps an empty weekly slot visible alongside overlapping programming", () => {
    const rows = plannerRows(
      [item(1, "2026-08-21T12:00:00+02:00", "2026-08-21T13:00:00+02:00")],
      [slot()],
      "2026-08-21",
    );

    expect(rows.map((row) => row.kind)).toEqual(["gap", "item", "weeklySlot", "gap"]);
    expect(rows[2].kind === "weeklySlot" && rows[2].items).toEqual([]);
  });
});
