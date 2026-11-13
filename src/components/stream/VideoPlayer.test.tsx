import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const vidstack = vi.hoisted(() => ({
  MediaPlayer: vi.fn(),
  MediaProvider: vi.fn(),
  Poster: vi.fn(),
  isDASHProvider: vi.fn(),
  isHLSSrc: vi.fn(),
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
  const setPlayerState = ({ error = null }: { error?: { code: number } | null }) => {
    vidstack.useMediaState.mockImplementation((key: string) =>
      key === "error" ? error : undefined,
    );
  };

  it("explains when no provider supports any video source", () => {
    setPlayerState({ error: { code: 4 } });

    render(<UnsupportedVideoMessage />);

    expect(screen.getByRole("alert").textContent).toBe(
      "Vi beklager, men denne videoen er ikke tilgjengelig i et format støttet av din nettleser. Vi jobber med å utbedre problemet.",
    );
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
  const sources = [
    { src: "/dash/manifest.mpd", type: "application/dash+xml" as const },
    { src: "/hls/master.m3u8", type: "application/vnd.apple.mpegurl" as const },
  ];

  const renderedPlayerProps = (props: Parameters<typeof VideoPlayer>[0]) => {
    vidstack.MediaPlayer.mockReturnValue(null);
    vidstack.isHLSSrc.mockImplementation((source: { type: string }) =>
      source.type.includes("mpegurl"),
    );
    render(<VideoPlayer {...props} />);
    return vidstack.MediaPlayer.mock.calls.at(-1)![0];
  };

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).WebKitPlaybackTargetAvailabilityEvent;
  });

  it("passes an initial playback time to Vidstack", () => {
    expect(
      renderedPlayerProps({ title: "A video", src: "/video.webm", startTime: 90 }).currentTime,
    ).toBe(90);
  });

  it("leaves source order and hls.js alone where AirPlay is not available", () => {
    const props = renderedPlayerProps({ title: "A video", src: sources });

    expect(props.src).toEqual(sources);
    expect(props.preferNativeHLS).toBe(false);
  });

  it("plays HLS natively first where the browser can AirPlay", () => {
    (window as unknown as Record<string, unknown>).WebKitPlaybackTargetAvailabilityEvent = class {};

    const props = renderedPlayerProps({ title: "A video", src: sources });

    expect(props.src).toEqual([sources[1], sources[0]]);
    expect(props.preferNativeHLS).toBe(true);
  });
});
