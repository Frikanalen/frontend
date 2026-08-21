import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { parsePhase, phaseOf } from "./useDatePhaseInHash";

// The phases are about the Norwegian broadcast day, so the suite runs somewhere
// else on purpose: in Oslo every assertion below would hold even if phaseOf read
// the local clock, and the test would prove nothing.
const ORIGINAL_TZ = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/New_York";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

const MORNING = 0;
const DAY = 1;
const EVENING = 2;
const NIGHT = 3;

describe("phaseOf", () => {
  it("runs in a timezone that would give a different answer", () => {
    // Guards the premise of the tests below: if this ever fails, the process is
    // back on Oslo time and the timezone cases have stopped being meaningful.
    expect(new Date("2026-08-21T05:00:00Z").getHours()).not.toBe(7);
  });

  it.each([
    ["06:00", MORNING],
    ["11:59", MORNING],
    ["12:00", DAY],
    ["17:59", DAY],
    ["18:00", EVENING],
    ["23:59", EVENING],
    ["00:00", NIGHT],
    ["05:59", NIGHT],
  ])("puts %s Oslo time in phase %i", (osloTime, expected) => {
    expect(phaseOf(new Date(`2026-08-21T${osloTime}:00+02:00`))).toBe(expected);
  });

  it("reads the hour in Oslo, not on the viewer's own clock", () => {
    // 07:00 in Oslo is still the small hours in New York, where the viewer's
    // clock would file this under night rather than morning.
    expect(phaseOf(new Date("2026-08-21T05:00:00Z"))).toBe(MORNING);
  });

  it("follows Oslo across the winter offset", () => {
    // 07:00 Oslo in January is UTC+1, an hour off the summer case above.
    expect(phaseOf(new Date("2026-01-15T06:00:00Z"))).toBe(MORNING);
  });

  it("keeps late-evening programs out of the following night", () => {
    // 23:00 Oslo is already the next day in UTC terms for a viewer further east,
    // but it belongs to this broadcast evening.
    expect(phaseOf(new Date("2026-08-21T21:00:00Z"))).toBe(EVENING);
  });
});

describe("parsePhase", () => {
  it.each([
    ["p0", MORNING],
    ["p1", DAY],
    ["p2", EVENING],
    ["p3", NIGHT],
  ])("reads %s as phase %i", (hash, expected) => {
    expect(parsePhase(hash)).toBe(expected);
  });

  it.each([
    ["p4", "a phase that doesn't exist"],
    ["p9", "a digit out of range"],
    ["px", "a non-digit"],
    ["p", "the prefix alone"],
    ["", "an empty hash"],
    ["2", "a bare number, as an older link might carry"],
    ["pp2", "anything longer than two characters"],
  ])("rejects %s (%s)", (hash) => {
    expect(parsePhase(hash)).toBeNull();
  });
});
