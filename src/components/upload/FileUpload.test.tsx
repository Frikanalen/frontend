import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  useVideosRetrieve: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/upload/useTusUpload", () => ({
  useTusUpload: () => ({
    onFileListChange: vi.fn(),
    start: vi.fn(),
    isReady: false,
    progress: 100,
    file: new File(["video"], "video.mp4", { type: "video/mp4" }),
    isUploading: false,
    isError: false,
    error: null,
    isSuccess: true,
  }),
}));

vi.mock("@/lib/upload/useIngestProgress", () => ({
  POLL_INTERVAL_MS: 2000,
  useIngestProgress: () => ({
    description: { phase: "working", message: "Lager visningskopier...", percentage: 12 },
    reportedAt: "2026-09-04T18:00:00Z",
    isError: false,
  }),
}));

vi.mock("@/generated/videos/videos", () => ({
  useVideosRetrieve: mocks.useVideosRetrieve,
}));

import { FileUpload } from "./FileUpload";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FileUpload", () => {
  it("redirects as soon as the temporary DASH preview appears", async () => {
    mocks.useVideosRetrieve.mockReturnValue({
      data: {
        data: {
          files: {
            dashPreview: {
              url: "https://media.example/preview/manifest.mpd",
              mimeType: "application/dash+xml",
            },
          },
        },
      },
    });

    render(<FileUpload videoId={7} uploadEndpoint="/uploads" uploadToken="upload-token" />);

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/video/7"));
  });
});
