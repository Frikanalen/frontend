import { describe, it, expect } from "vitest";
import { formatDuration, formatPublished, spokenDuration } from "./videoMeta";

describe("formatDuration", () => {
  it("reads a short video as minutes and seconds", () => {
    expect(formatDuration(494)).toBe("8:14");
  });

  it("pads the seconds but not the leading minutes", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("grows an hours field once there is one", () => {
    expect(formatDuration(3800)).toBe("1:03:20");
  });

  // Minutes only get their zero once an hour precedes them, which is what
  // every video player does.
  it("pads the minutes once they follow an hour", () => {
    expect(formatDuration(3670)).toBe("1:01:10");
  });

  it("keeps a zero minute rather than dropping the field", () => {
    expect(formatDuration(45)).toBe("0:45");
  });

  // The API reports fractional seconds. 0:59 for a video that is a tenth of a
  // second short of a minute is the worse of the two lies.
  it("rounds the fractional seconds the API sends", () => {
    expect(formatDuration(59.7)).toBe("1:00");
    expect(formatDuration(3201.6)).toBe("53:22");
  });
});

describe("spokenDuration", () => {
  it("spells out a running time under a minute", () => {
    expect(spokenDuration(45)).toBe("45 sekunder");
  });

  it("spells out minutes", () => {
    expect(spokenDuration(494)).toBe("8 minutter");
  });

  it("spells out both fields", () => {
    expect(spokenDuration(3800)).toBe("1 time og 3 minutter");
  });

  it("leaves out a field that is zero", () => {
    expect(spokenDuration(3600)).toBe("1 time");
  });

  it("counts more than one hour", () => {
    expect(spokenDuration(7380)).toBe("2 timer og 3 minutter");
  });

  it("says one minute in the singular", () => {
    expect(spokenDuration(60)).toBe("1 minutt");
  });

  // The badge shows "8:14" and floors to the minute; a spoken form that
  // rounded to 8 or 9 would disagree with the number on screen.
  it("floors to the same minute the badge shows", () => {
    expect(spokenDuration(534)).toBe("8 minutter");
  });
});

describe("formatPublished", () => {
  it("abbreviates the month and keeps the day", () => {
    expect(formatPublished("2025-04-04T09:54:19.722961Z")).toBe("4. apr. 2025");
  });
});
