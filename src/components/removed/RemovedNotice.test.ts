import { describe, expect, it } from "vitest";
import { isRemovedVideo } from "./RemovedNotice";

describe("isRemovedVideo", () => {
  it("recognises the removal answer", () => {
    expect(
      isRemovedVideo({
        detail: "Administrativt fjernet i påvente av gjennomgang.",
        code: "video_removed",
      }),
    ).toBe(true);
  });

  it("ignores other refusals", () => {
    expect(isRemovedVideo({ code: "organization_suspended", organization: { id: 1 } })).toBe(false);
    expect(isRemovedVideo(null)).toBe(false);
    expect(isRemovedVideo("video_removed")).toBe(false);
  });
});
