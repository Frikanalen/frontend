import React, { ReactNode } from "react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import {
  DASHSrc,
  isDASHProvider,
  MediaPlayer,
  MediaProvider,
  MediaProviderAdapter,
  Poster,
  useMediaRemote,
  useMediaState,
  VideoSrc,
} from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import "./videoplayer.css";
import { Spinner } from "@heroui/react";
import cx from "classnames";

declare global {
  interface Window {
    dashjs?: typeof import("dashjs");
  }
}

// Vidstack loads dash.js off jsDelivr by default; serve it from our own bundle instead.
// It only ends up in a chunk the browser fetches once a DASH source is actually selected.
const loadDashjs = async () => {
  const dashjs = (await import("dashjs")).default;
  // The UMD build only assigns `window.dashjs` when loaded through a <script> tag,
  // and vidstack reads that global to check for Media Source support.
  window.dashjs ??= dashjs;
  return { default: dashjs };
};

const onProviderChange = (provider: MediaProviderAdapter | null) => {
  if (isDASHProvider(provider)) provider.library = loadDashjs;
};

// With `load="play"` vidstack only renders its load layout — a small centre play button — until
// playback starts, and its click-to-play gestures don't exist yet. Cover the whole poster so any
// click starts the video. The real play button stays on top for keyboard and screen reader users.
const StartOnClick = () => {
  const started = useMediaState("started");
  const remote = useMediaRemote();

  if (started) return null;

  return (
    <div
      aria-hidden
      className="absolute inset-0 z-40 cursor-pointer"
      onPointerUp={(event) => {
        if (event.button !== 0) return;
        remote.play(event.nativeEvent);
      }}
    />
  );
};

// Anything drawn over the still frame - the schedule listing on the front page -
// belongs to the poster, not to the stream: once playback starts it goes away and
// leaves the picture and vidstack's own controls alone.
const BeforePlayback = ({ children }: { children: ReactNode }) => {
  const started = useMediaState("started");

  if (started) return null;

  return <>{children}</>;
};

export const VideoPlayer = ({
  title,
  src,
  poster,
  mediaPending,
  overlay,
}: {
  title: string;
  src: string | VideoSrc | DASHSrc | (VideoSrc | DASHSrc)[];
  poster?: string;
  mediaPending?: boolean;
  overlay?: ReactNode;
}) => {
  return (
    <MediaPlayer
      title={title}
      src={src}
      poster={poster}
      aspectRatio="16/9"
      load="play"
      onProviderChange={onProviderChange}
    >
      {mediaPending && (
        <div className="absolute z-50 inset-0 bg-default-800/20 flex flex-col items-center justify-center gap-8">
          <h2>Vennligst vent mens vi behandler din video...</h2>
          <Spinner size={"lg"} />
          <p>Det kan drøye en stund.</p>
        </div>
      )}
      <StartOnClick />
      {overlay && <BeforePlayback>{overlay}</BeforePlayback>}
      <MediaProvider>
        <Poster className={cx("vds-poster", { "blur-md": mediaPending })} src={poster} />
      </MediaProvider>
      <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme={"system"} />
    </MediaPlayer>
  );
};

export default VideoPlayer;
