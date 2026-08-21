import { describe, expect, it } from "vitest";
import type { ScheduleitemRead, WeeklySlotRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { openDates, osloDateTime, plannerRows } from "./plannerRows";

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
  purpose: { id: 3, name: "Fast ukesending" },
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

  it("does not duplicate a weekly slot once it has a schedule item", () => {
    const scheduled = {
      ...item(1, "2026-08-21T12:00:00+02:00", "2026-08-21T13:00:00+02:00"),
      weeklySlot: 7,
    };

    const rows = plannerRows([scheduled], [slot()], "2026-08-21");

    expect(rows.map((row) => row.kind)).toEqual(["gap", "item", "gap"]);
  });
});
