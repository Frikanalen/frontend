import { describe, expect, it } from "vitest";
import { clearUpload, peekUpload, stashUpload } from "./pendingUploads";

describe("pending uploads", () => {
  it("keeps a stashed file until it is cleared", () => {
    const file = new File(["video"], "kaia.mp4");
    stashUpload(7, file);

    expect(peekUpload(7)).toBe(file);
    expect(peekUpload(7)).toBe(file);
    clearUpload(7);
    expect(peekUpload(7)).toBeUndefined();
  });
});
