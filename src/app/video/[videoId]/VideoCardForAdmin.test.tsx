import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Video } from "@/generated/frikanalenDjangoAPI.schemas";

const mocks = vi.hoisted(() => ({
  playerMounts: vi.fn(),
  videoResponse: undefined as { data: Video } | undefined,
}));

vi.mock("@/generated/videos/videos", () => ({
  useVideosRetrieve: () => ({ data: mocks.videoResponse }),
}));

vi.mock("@/lib/upload/useIngestProgress", () => ({
  POLL_INTERVAL_MS: 2000,
  useIngestProgress: () => ({
    description: { phase: "working", message: "Lager visningskopier...", percentage: 37 },
    reportedAt: "2026-09-04T18:00:00Z",
    isError: false,
  }),
}));

vi.mock("@/components/stream/VideoPlayer", async () => {
  const { useEffect } = await import("react");

  return {
    default: function MockVideoPlayer({ src }: { src: Array<{ src: string }> }) {
      useEffect(() => {
        mocks.playerMounts();
      }, []);

      return <div data-testid="player" data-source={src[0]?.src} />;
    },
  };
});

vi.mock("@/app/video/[videoId]/VideoCardMeta", () => ({
  VideoCardMeta: () => <div data-testid="metadata" />,
}));

import { VideoCardForAdmin } from "./VideoCardForAdmin";

const videoWith = (files: Video["files"]): Video =>
  ({
    id: 7,
    name: "Havna vår",
    files,
    organization: { id: 2, name: "Havneforeningen", description: "", fkmember: true },
  }) as Video;

afterEach(() => {
  cleanup();
  mocks.videoResponse = undefined;
  vi.clearAllMocks();
});

describe("VideoCardForAdmin", () => {
  it("keeps processing progress below the preview and reloads the player for full DASH", async () => {
    const preview = videoWith({
      dashPreview: {
        url: "https://media.example/preview/manifest.mpd",
        mimeType: "application/dash+xml",
      },
    });
    const { rerender } = render(<VideoCardForAdmin video={preview} />);

    expect(screen.getByTestId("player").getAttribute("data-source")).toBe(
      "https://media.example/preview/manifest.mpd",
    );
    expect(screen.getByText(/foreløpig visningskopi i lavere kvalitet/)).toBeDefined();
    expect(screen.getByText("Lager visningskopier...")).toBeDefined();
    expect(mocks.playerMounts).toHaveBeenCalledTimes(1);

    mocks.videoResponse = {
      data: videoWith({
        dash: {
          url: "https://media.example/dash/manifest.mpd",
          mimeType: "application/dash+xml",
        },
        dashPreview: preview.files.dashPreview,
      }),
    };
    rerender(<VideoCardForAdmin video={preview} />);

    expect(screen.getByTestId("player").getAttribute("data-source")).toBe(
      "https://media.example/dash/manifest.mpd",
    );
    expect(screen.queryByText(/foreløpig visningskopi i lavere kvalitet/)).toBeNull();
    await waitFor(() => expect(mocks.playerMounts).toHaveBeenCalledTimes(2));
  });
});
