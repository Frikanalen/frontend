import { describe, expect, it } from "vitest";
import { ballistics, FLOOR_DB, meterFraction, peakDb } from "./meter";

describe("peakDb", () => {
  it("reads full scale as 0 dBFS and half scale as about -6", () => {
    expect(peakDb(new Float32Array([0.2, -1, 0.5]))).toBeCloseTo(0);
    expect(peakDb(new Float32Array([0.5, -0.25]))).toBeCloseTo(-6.02, 1);
  });

  it("puts silence on the floor", () => {
    expect(peakDb(new Float32Array(128))).toBe(FLOOR_DB);
    expect(peakDb(new Float32Array([1e-9]))).toBe(FLOOR_DB);
  });
});

describe("ballistics", () => {
  it("rises at once but falls at 20 dB a second", () => {
    expect(ballistics(-40, -10, 16)).toBe(-10);
    expect(ballistics(-10, -60, 500)).toBe(-20);
    expect(ballistics(-10, -12, 500)).toBe(-12);
  });
});

describe("meterFraction", () => {
  it("maps the floor to 0 and full scale to 1", () => {
    expect(meterFraction(FLOOR_DB)).toBe(0);
    expect(meterFraction(-30)).toBe(0.5);
    expect(meterFraction(0)).toBe(1);
    expect(meterFraction(6)).toBe(1);
  });
});
