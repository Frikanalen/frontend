import { act, cleanup, render, screen } from "@testing-library/react";
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
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("UnsupportedVideoMessage", () => {
  const fakeVideo = (videoWidth: number, videoHeight: number) =>
    Object.assign(new EventTarget(), { videoWidth, videoHeight });

  const setPlayerState = ({
    error = null,
    playing = false,
    video = null,
  }: {
    error?: { code: number } | null;
    playing?: boolean;
    video?: ReturnType<typeof fakeVideo> | null;
  }) => {
    vidstack.useMediaState.mockImplementation((key: string) =>
      key === "error" ? error : key === "playing" ? playing : undefined,
    );
    vidstack.useMediaProvider.mockReturnValue(video && { video });
    vidstack.isVideoProvider.mockReturnValue(video !== null);
  };

  it("explains when no provider supports any video source", () => {
    setPlayerState({ error: { code: 4 } });

    render(<UnsupportedVideoMessage />);

    expect(screen.getByRole("alert").textContent).toBe(
      "Vi beklager, men denne videoen er ikke tilgjengelig i et format støttet av din nettleser. Vi jobber med å utbedre problemet.",
    );
  });

  it("explains when the selected source keeps playing without a picture", () => {
    vi.useFakeTimers();
    setPlayerState({ playing: true, video: fakeVideo(0, 0) });

    render(<UnsupportedVideoMessage />);
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("waits for the first frame before judging the video size", () => {
    // iOS declares the player ready at `loadedmetadata`, before WebKit knows the video size.
    vi.useFakeTimers();
    const video = fakeVideo(0, 0);
    setPlayerState({ playing: true, video });

    render(<UnsupportedVideoMessage />);
    expect(screen.queryByRole("alert")).toBeNull();

    act(() => {
      Object.assign(video, { videoWidth: 1280, videoHeight: 720 });
      video.dispatchEvent(new Event("resize"));
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("stays out of the way when a video track was decoded", () => {
    vi.useFakeTimers();
    setPlayerState({ playing: true, video: fakeVideo(1280, 720) });

    render(<UnsupportedVideoMessage />);
    act(() => vi.advanceTimersByTime(1000));

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
