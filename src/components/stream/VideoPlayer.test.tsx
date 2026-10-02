import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const vidstack = vi.hoisted(() => ({
  MediaPlayer: vi.fn(),
  MediaProvider: vi.fn(),
  Poster: vi.fn(),
  isDASHProvider: vi.fn(),
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
  it("passes an initial playback time to Vidstack", () => {
    const player = VideoPlayer({ title: "A video", src: "/video.webm", startTime: 90 });

    expect(player.props.currentTime).toBe(90);
  });
});
