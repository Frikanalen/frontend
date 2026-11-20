import { describe, expect, it } from "vitest";
import { isRemovedVideo, removedVideoOwnerFrom } from "./RemovedNotice";

describe("isRemovedVideo", () => {
  it("recognises the removal answer", () => {
    expect(
      isRemovedVideo({ detail: "Denne videoen er utilgjengelig.", code: "video_removed" }),
    ).toBe(true);
  });

  it("ignores other refusals", () => {
    expect(isRemovedVideo({ code: "organization_suspended", organization: { id: 1 } })).toBe(false);
    expect(isRemovedVideo(null)).toBe(false);
    expect(isRemovedVideo("video_removed")).toBe(false);
  });
});

describe("removedVideoOwnerFrom", () => {
  it("names the organization only when the answer does", () => {
    const organization = { id: 3, name: "Some org" };
    expect(removedVideoOwnerFrom({ code: "video_removed", organization })).toEqual(organization);
    expect(removedVideoOwnerFrom({ code: "video_removed" })).toBeNull();
    expect(removedVideoOwnerFrom({ code: "organization_suspended", organization })).toBeNull();
  });
});
