import React from "react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { MediaPlayer, MediaProvider, Poster, VideoSrc } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import "./videoplayer.css";
import { Spinner } from "@heroui/react";
import cx from "classnames";

export const VideoPlayer = ({
  title,
  src,
  poster,
  mediaPending,
}: {
  title: string;
  src: string | VideoSrc | VideoSrc[];
  poster?: string;
  mediaPending?: boolean;
}) => {
  return (
    <MediaPlayer title={title} src={src} poster={poster} aspectRatio="16/9" load="play">
      {mediaPending && (
        <div className="absolute z-50 inset-0 bg-default-800/20 flex flex-col items-center justify-center gap-8">
          <h2>Vennligst vent mens vi behandler din video...</h2>
          <Spinner size={"lg"} />
          <p>Det kan drøye en stund.</p>
        </div>
      )}
      <MediaProvider>
        <Poster className={cx("vds-poster", { "blur-md": mediaPending })} src={poster} />
      </MediaProvider>
      <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme={"system"} />
    </MediaPlayer>
  );
};

export default VideoPlayer;
