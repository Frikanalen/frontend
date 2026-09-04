import { describe, expect, it } from "vitest";
import type { VideoFiles } from "@/generated/frikanalenDjangoAPI.schemas";
import { djangoVideoFilesToVidstackSrcList } from "./VideoCard";

describe("djangoVideoFilesToVidstackSrcList", () => {
  it("uses API-provided MIME types in playback preference order", () => {
    const files = {
      theora: { url: "https://media.example/video.ogv", mimeType: "video/ogg" },
      dash: { url: "https://media.example/manifest.mpd", mimeType: "application/dash+xml" },
      dashPreview: {
        url: "https://media.example/preview/manifest.mpd",
        mimeType: "application/dash+xml",
      },
      webmMed: { url: "https://media.example/video.webm", mimeType: "video/webm" },
      broadcast: { url: "https://media.example/master.dv", mimeType: "video/DV" },
    } satisfies VideoFiles;

    expect(djangoVideoFilesToVidstackSrcList(files)).toEqual([
      { src: "https://media.example/manifest.mpd", type: "application/dash+xml" },
      { src: "https://media.example/preview/manifest.mpd", type: "application/dash+xml" },
      { src: "https://media.example/video.webm", type: "video/webm" },
      { src: "https://media.example/video.ogv", type: "video/ogg" },
    ]);
  });

  it("uses the temporary DASH preview when the full ladder is not ready", () => {
    const files = {
      dashPreview: {
        url: "https://media.example/preview/manifest.mpd",
        mimeType: "application/dash+xml",
      },
    } satisfies VideoFiles;

    expect(djangoVideoFilesToVidstackSrcList(files)).toEqual([
      { src: "https://media.example/preview/manifest.mpd", type: "application/dash+xml" },
    ]);
  });

  it("omits absent files and files without a playable MIME type", () => {
    const files = {
      dash: { url: "https://media.example/manifest.mpd", mimeType: null },
      theora: { url: "https://media.example/video.ogv", mimeType: "application/octet-stream" },
    } satisfies VideoFiles;

    expect(djangoVideoFilesToVidstackSrcList(files)).toEqual([]);
  });
});
