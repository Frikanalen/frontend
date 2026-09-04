import { describe, expect, it } from "vitest";
import { videoStartTimeFrom } from "./videoStartTime";

describe("videoStartTimeFrom", () => {
  it("reads whole and fractional seconds", () => {
    expect(videoStartTimeFrom("90")).toBe(90);
    expect(videoStartTimeFrom("12.5")).toBe(12.5);
  });

  it.each([undefined, "", "-1", "1m30s", "seconds", "Infinity", ["10", "20"]])(
    "ignores an invalid t value: %j",
    (value) => {
      expect(videoStartTimeFrom(value)).toBeUndefined();
    },
  );
});
