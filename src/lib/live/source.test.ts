import { describe, expect, it } from "vitest";
import { removeEncoderQuestion, sourceStatus } from "./source";

const pushed = { enabled: true, isPulled: false, encoderCount: 1 };

describe("sourceStatus", () => {
  it("names the state a member can act on", () => {
    expect(sourceStatus(pushed)).toBe("waiting");
    expect(sourceStatus(pushed, { receiving: false })).toBe("waiting");
    expect(sourceStatus(pushed, { receiving: true })).toBe("receiving");
    expect(sourceStatus({ ...pushed, encoderCount: 0 })).toBe("no-encoder");
    expect(sourceStatus({ ...pushed, enabled: false }, { receiving: true })).toBe("off");
  });

  it("asks no encoder of a source Frikanalen fetches", () => {
    const pulled = { enabled: true, isPulled: true, encoderCount: 0 };
    expect(sourceStatus(pulled, { receiving: false })).toBe("on-demand");
    expect(sourceStatus(pulled, { receiving: true })).toBe("receiving");
  });
});

describe("removeEncoderQuestion", () => {
  it("says only what follows from removing this encoder", () => {
    const plain = removeEncoderQuestion({ label: "OBS", last: false, receiving: false });
    expect(plain).toBe("Fjerne «OBS»? Koderen kan ikke lenger sende til denne kilden.");
    const grave = removeEncoderQuestion({
      label: "ATEM",
      last: true,
      receiving: true,
      booking: "«Høstkonsert», fredag 13. november kl. 19:00",
    });
    expect(grave).toContain("den eneste koderen");
    expect(grave).toContain("mottar signal nå");
    expect(grave).toContain("skal på lufta: «Høstkonsert», fredag 13. november kl. 19:00.");
  });
});
