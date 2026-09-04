import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const vidstack = vi.hoisted(() => ({
  MediaPlayer: vi.fn(),
  MediaProvider: vi.fn(),
  Poster: vi.fn(),
  isDASHProvider: vi.fn(),
  isHLSProvider: vi.fn(),
  isVideoProvider: vi.fn(),
  useMediaProvider: vi.fn(),
  useMediaRemote: vi.fn(),
  useMediaState: vi.fn(),
}));

vi.mock("@vidstack/react", () => vidstack);

import { UnsupportedVideoMessage, VideoPlayer } from "./VideoPlayer";

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("UnsupportedVideoMessage", () => {
  const setPlayerState = ({
    error = null,
    canPlay = false,
    provider = null,
  }: {
    error?: { code: number } | null;
    canPlay?: boolean;
    provider?: { video: { videoWidth: number; videoHeight: number } } | null;
  }) => {
    vidstack.useMediaState.mockImplementation((key: string) => (key === "error" ? error : canPlay));
    vidstack.useMediaProvider.mockReturnValue(provider);
    vidstack.isVideoProvider.mockReturnValue(provider !== null);
  };

  it("explains when no provider supports any video source", () => {
    setPlayerState({ error: { code: 4 } });

    render(<UnsupportedVideoMessage />);

    expect(screen.getByRole("alert").textContent).toBe(
      "Vi beklager, men denne videoen er ikke tilgjengelig i et format støttet av din nettleser. Vi jobber med å utbedre problemet.",
    );
  });

  it("explains when the selected source decodes only its audio track", () => {
    setPlayerState({
      canPlay: true,
      provider: { video: { videoWidth: 0, videoHeight: 0 } },
    });

    render(<UnsupportedVideoMessage />);

    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("stays out of the way when a video track was decoded", () => {
    setPlayerState({
      canPlay: true,
      provider: { video: { videoWidth: 1280, videoHeight: 720 } },
    });

    render(<UnsupportedVideoMessage />);

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("does not mislabel another playback error as an unsupported format", () => {
    setPlayerState({ error: { code: 2 } });

    render(<UnsupportedVideoMessage />);

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps the processing message in charge while media is pending", () => {
    setPlayerState({ error: { code: 4 } });

    render(<UnsupportedVideoMessage mediaPending />);

    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("VideoPlayer", () => {
  it("passes an initial playback time to Vidstack", () => {
    const player = VideoPlayer({ title: "A video", src: "/video.webm", startTime: 90 });

    expect(player.props.currentTime).toBe(90);
  });
});
