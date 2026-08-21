import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";

const { listSchedule } = vi.hoisted(() => ({ listSchedule: vi.fn() }));

vi.mock("@/generated/ssr/scheduleitems/scheduleitems", () => ({
  ssrScheduleitemsList: listSchedule,
}));

import { getScheduleForToday } from "./getScheduleForToday";

const PROGRAM = { id: 1, starttime: "2026-08-21T20:00:00+02:00" } as ScheduleitemRead;

const answerWith = (status: number, data: unknown) =>
  listSchedule.mockResolvedValue({ status, data });

beforeEach(() => {
  listSchedule.mockReset();
  // The failure paths log; the suite shouldn't.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("getScheduleForToday", () => {
  it("returns the items the API answered with", async () => {
    answerWith(200, { count: 1, results: [PROGRAM] });

    await expect(getScheduleForToday()).resolves.toEqual([PROGRAM]);
  });

  it("asks for today's date in Oslo, with the surrounding items", async () => {
    // Late enough in the evening that UTC has already rolled over to the 22nd,
    // while Oslo is only just past midnight on the same day.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-21T23:30:00Z"));
    answerWith(200, { count: 0, results: [] });

    await getScheduleForToday();

    expect(listSchedule).toHaveBeenCalledWith(
      { date: "2026-08-22", surrounding: true },
      expect.anything(),
    );
  });

  it("gives up quietly when the API answers with an error", async () => {
    answerWith(500, { detail: "Server Error" });

    await expect(getScheduleForToday()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it("gives up quietly when the backend can't be reached at all", async () => {
    listSchedule.mockRejectedValue(new TypeError("fetch failed"));

    await expect(getScheduleForToday()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it("survives a 200 with no results in the body", async () => {
    answerWith(200, { count: 0 });

    await expect(getScheduleForToday()).resolves.toEqual([]);
  });
});
