import { describe, expect, it } from "vitest";
import { broadcastState, formatCountdown } from "./broadcast";

const at = (time: string) => Date.parse(`2026-11-13T${time}Z`);
const bookings = [
  {
    id: 1,
    name: "Gudstjeneste",
    starttime: "2026-11-13T10:00:00Z",
    endtime: "2026-11-13T11:00:00Z",
  },
  { id: 2, name: "Konsert", starttime: "2026-11-13T18:00:00Z", endtime: "2026-11-13T19:30:00Z" },
];

describe("broadcastState", () => {
  it("counts down to the next booking", () => {
    expect(broadcastState(bookings, at("09:58:30"))).toEqual({
      state: "upcoming",
      booking: bookings[0],
      until: 90_000,
    });
  });

  it("is on air from the booked start until the booked end", () => {
    expect(broadcastState(bookings, at("10:00:00"))).toMatchObject({
      state: "onair",
      remaining: 3_600_000,
    });
    expect(broadcastState(bookings, at("10:59:59")).state).toBe("onair");
  });

  it("moves on to the next booking when one has ended, though the list still has it", () => {
    expect(broadcastState(bookings, at("11:00:00"))).toMatchObject({
      state: "upcoming",
      booking: bookings[1],
    });
    expect(broadcastState(bookings, at("19:30:00"))).toEqual({ state: "none" });
    expect(broadcastState([], at("10:00:00"))).toEqual({ state: "none" });
  });
});

describe("formatCountdown", () => {
  it("reads like a clock at every distance", () => {
    expect(formatCountdown(90_000)).toBe("01:30");
    expect(formatCountdown(3_723_000)).toBe("1:02:03");
    expect(formatCountdown(3 * 86_400_000 + 14_706_000)).toBe("3 d 04:05:06");
  });

  it("rounds up and stops at zero", () => {
    expect(formatCountdown(400)).toBe("00:01");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(-5000)).toBe("00:00");
  });
});
