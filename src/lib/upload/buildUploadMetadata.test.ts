import { describe, expect, it } from "vitest";

import { buildUploadMetadata } from "./buildUploadMetadata";

describe("buildUploadMetadata", () => {
  it("adds programme-image metadata without changing the video upload fields", () => {
    const file = new File(["image"], "key-art.png", { type: "image/png" });

    expect(
      buildUploadMetadata(file, "1234", "token", {
        uploadKind: "program_image",
        imageRole: "key_art_titled",
      }),
    ).toEqual({
      origFileName: "key-art.png",
      videoID: "1234",
      uploadToken: "token",
      uploadKind: "program_image",
      imageRole: "key_art_titled",
    });
  });
});
