import { describe, it, expect } from "vitest";
import { getScheduleCursor } from "./useScheduleCursor";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";

// Just the fields the cursor looks at; the rest of a schedule item is irrelevant here.
const item = (id: number, starttime: string, endtime: string) =>
  ({ id, starttime, endtime }) as ScheduleitemRead;

const morning = item(1, "2026-08-21T09:00:00+02:00", "2026-08-21T10:00:00+02:00");
const noon = item(2, "2026-08-21T12:00:00+02:00", "2026-08-21T13:00:00+02:00");
const evening = item(3, "2026-08-21T20:00:00+02:00", "2026-08-21T21:00:00+02:00");
const schedule = [morning, noon, evening];

const at = (time: string) => new Date(`2026-08-21T${time}+02:00`);

describe("getScheduleCursor", () => {
  it("finds the program on air and the one after it", () => {
    expect(getScheduleCursor(at("12:30:00"), schedule)).toEqual({
      currentProgram: noon,
      nextProgram: evening,
    });
  });

  it("reports no program on air during a gap in the schedule, but still finds the next one", () => {
    expect(getScheduleCursor(at("11:00:00"), schedule)).toEqual({
      currentProgram: undefined,
      nextProgram: noon,
    });
  });

  it("reports nothing at all once the schedule has run out", () => {
    expect(getScheduleCursor(at("23:00:00"), schedule)).toEqual({
      currentProgram: undefined,
      nextProgram: undefined,
    });
  });

  // Regression: schedule.at(-1) turned "found nothing" into the last item of the
  // day, so an empty schedule used to report programs that weren't there.
  it("reports nothing at all for an empty schedule", () => {
    expect(getScheduleCursor(at("12:30:00"), [])).toEqual({
      currentProgram: undefined,
      nextProgram: undefined,
    });
  });

  it("hands over at the boundary rather than counting the item that just ended", () => {
    expect(getScheduleCursor(at("13:00:00"), schedule)).toEqual({
      currentProgram: undefined,
      nextProgram: evening,
    });
  });

  it("counts a program as on air from its very first second", () => {
    expect(getScheduleCursor(at("12:00:00"), schedule)).toEqual({
      currentProgram: noon,
      nextProgram: evening,
    });
  });

  it("ignores items with unusable timestamps instead of throwing", () => {
    const broken = [item(4, "not a date", "nor is this"), noon];

    expect(getScheduleCursor(at("11:00:00"), broken)).toEqual({
      currentProgram: undefined,
      nextProgram: noon,
    });
  });

  it("picks the earliest upcoming program even if the schedule arrives out of order", () => {
    expect(getScheduleCursor(at("11:00:00"), [evening, noon, morning])).toEqual({
      currentProgram: undefined,
      nextProgram: noon,
    });
  });
});
