import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { getScheduleCursor, useScheduleCursor } from "./useScheduleCursor";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";

// Just the fields the cursor looks at; the rest of a schedule item is irrelevant here.
const item = (id: number, starttime: string, endtime: string) =>
  ({ id, starttime, endtime }) as ScheduleitemRead;

const morning = item(1, "2026-08-21T09:00:00Z", "2026-08-21T10:00:00Z");
const noon = item(2, "2026-08-21T12:00:00Z", "2026-08-21T13:00:00Z");
const afternoon = item(3, "2026-08-21T13:00:00Z", "2026-08-21T14:00:00Z");
const evening = item(4, "2026-08-21T18:00:00Z", "2026-08-21T19:00:00Z");

const at = (time: string) => new Date(`2026-08-21T${time}Z`);

describe("getScheduleCursor", () => {
  const schedule = [morning, noon, evening];

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
    const broken = [item(5, "not a date", "nor is this"), noon];

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

describe("useScheduleCursor", () => {
  const clockAt = (time: string) => vi.setSystemTime(at(time));

  // The hook re-reads the clock once a second; this is how many of those pass.
  const tick = (seconds: number) => act(() => void vi.advanceTimersByTime(seconds * 1000));

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("starts on the program that is on air", () => {
    clockAt("12:30:00");

    const { result } = renderHook(() => useScheduleCursor([noon, afternoon]));

    expect(result.current.currentProgram).toBe(noon);
    expect(result.current.nextProgram).toBe(afternoon);
  });

  it("moves on when one program hands over to the next", () => {
    clockAt("12:59:59");
    const { result } = renderHook(() => useScheduleCursor([noon, afternoon, evening]));

    expect(result.current.currentProgram).toBe(noon);

    clockAt("13:00:01");
    tick(1);

    expect(result.current.currentProgram).toBe(afternoon);
    expect(result.current.nextProgram).toBe(evening);
  });

  // Regression: the tick used to compare the current program alone, so in a gap
  // - where it stays undefined - the next program never advanced.
  it("keeps advancing the next program during a gap in the schedule", () => {
    clockAt("14:30:00");
    const { result } = renderHook(() => useScheduleCursor([noon, afternoon, evening]));

    expect(result.current).toEqual({ currentProgram: undefined, nextProgram: evening });

    clockAt("19:30:00");
    tick(1);

    expect(result.current).toEqual({ currentProgram: undefined, nextProgram: undefined });
  });

  it("doesn't re-render while the same program stays on air", () => {
    clockAt("12:30:00");
    let renders = 0;

    renderHook(() => {
      renders += 1;
      return useScheduleCursor([noon, afternoon]);
    });

    const initial = renders;
    clockAt("12:30:30");
    tick(30);

    expect(renders).toBe(initial);
  });

  it("reports nothing rather than inventing a program when the schedule is empty", () => {
    clockAt("12:30:00");

    const { result } = renderHook(() => useScheduleCursor([]));

    expect(result.current).toEqual({ currentProgram: undefined, nextProgram: undefined });

    tick(5);

    expect(result.current).toEqual({ currentProgram: undefined, nextProgram: undefined });
  });
});
