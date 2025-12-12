import { describe, it, expect } from "vitest";
import { formatOsloDateISO } from "./formatOsloDateISO";

describe("getOsloDateAt", () => {
  it("should format a date in Oslo timezone as ISO date string", () => {
    const inputDate = new Date("2023-06-15T14:30:00Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toBe("2023-06-15");
  });

  it("should handle dates that cross day boundaries due to timezone", () => {
    // This is 2023-06-14 23:00:00 UTC, but in Oslo (UTC+2 in summer) it's 2023-06-15 01:00:00
    const inputDate = new Date("2023-06-14T23:00:00Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toBe("2023-06-15");
  });

  it("should handle winter time dates correctly (UTC+1)", () => {
    // This is 2023-01-14 23:30:00 UTC, but in Oslo (UTC+1 in winter) it's 2023-01-15 00:30:00
    const inputDate = new Date("2023-01-14T23:30:00Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toBe("2023-01-15");
  });

  it("should handle dates at midnight UTC", () => {
    const inputDate = new Date("2023-06-15T00:00:00Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toBe("2023-06-15");
  });

  it("should handle dates just before midnight in Oslo timezone", () => {
    // This is 2023-06-15 21:59:59 UTC, which is 2023-06-15 23:59:59 in Oslo
    const inputDate = new Date("2023-06-15T21:59:59Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toBe("2023-06-15");
  });

  it("should handle dates at the start of the year", () => {
    const inputDate = new Date("2023-01-01T00:00:00Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toBe("2023-01-01");
  });

  it("should handle dates at the end of the year", () => {
    const inputDate = new Date("2023-12-31T23:00:00Z");
    const result = formatOsloDateISO(inputDate);

    // In Oslo (UTC+1 in winter), this is 2024-01-01 00:00:00
    expect(result).toBe("2024-01-01");
  });

  it("should handle leap year dates", () => {
    const inputDate = new Date("2024-02-29T12:00:00Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toBe("2024-02-29");
  });

  it("should return ISO format YYYY-MM-DD", () => {
    const inputDate = new Date("2023-06-15T14:30:00Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should handle dates during daylight saving time transition (spring forward)", () => {
    // March 26, 2023 is when Oslo transitions to summer time (UTC+2)
    const beforeTransition = new Date("2023-03-26T00:00:00Z");
    const result = formatOsloDateISO(beforeTransition);

    expect(result).toBe("2023-03-26");
  });

  it("should handle dates during daylight saving time transition (fall back)", () => {
    // October 29, 2023 is when Oslo transitions back to standard time (UTC+1)
    const duringTransition = new Date("2023-10-29T00:00:00Z");
    const result = formatOsloDateISO(duringTransition);

    expect(result).toBe("2023-10-29");
  });

  it("should handle very old dates", () => {
    const inputDate = new Date("1900-01-01T12:00:00Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toBe("1900-01-01");
  });

  it("should handle far future dates", () => {
    const inputDate = new Date("2100-12-31T12:00:00Z");
    const result = formatOsloDateISO(inputDate);

    expect(result).toBe("2100-12-31");
  });
});
