import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { formatOsloTime, inOsloTime } from "./osloTime";

// Every assertion here is about not reading the local clock, so the suite runs
// somewhere that is not Norway: in Oslo they would all hold against a plain
// `new Date()` too, and prove nothing.
const ORIGINAL_TZ = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/New_York";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

describe("formatOsloTime", () => {
  it("runs in a timezone that would give a different answer", () => {
    // Guards the premise of the cases below, the way the phase tests do.
    expect(new Date("2026-08-21T19:30:00Z").getHours()).not.toBe(21);
  });

  it("prints a summer instant on Oslo's clock (UTC+2)", () => {
    expect(formatOsloTime("2026-08-21T19:30:00Z")).toBe("21:30");
  });

  it("prints a winter instant on Oslo's clock (UTC+1)", () => {
    expect(formatOsloTime("2026-01-15T19:30:00Z")).toBe("20:30");
  });

  it("leaves a start time the API already sent in Oslo terms alone", () => {
    // How scheduleitems reports a program: an offset the viewer never sees.
    expect(formatOsloTime("2026-08-21T09:00:00+02:00")).toBe("09:00");
  });

  it("keeps a small-hours program in the small hours", () => {
    // 00:30 in Oslo is still the evening of the day before in New York, which
    // is exactly the case that used to print 18:30 to a viewer there.
    expect(formatOsloTime("2026-08-22T00:30:00+02:00")).toBe("00:30");
  });

  it("accepts a Date as readily as a string", () => {
    expect(formatOsloTime(new Date("2026-08-21T19:30:00Z"))).toBe("21:30");
  });
});

describe("inOsloTime", () => {
  it("reports the Oslo hour rather than the runner's", () => {
    expect(inOsloTime("2026-08-21T19:30:00Z").getHours()).toBe(21);
  });

  it("preserves the instant it was given", () => {
    const instant = "2026-08-21T19:30:00Z";
    expect(inOsloTime(instant).getTime()).toBe(new Date(instant).getTime());
  });
});
