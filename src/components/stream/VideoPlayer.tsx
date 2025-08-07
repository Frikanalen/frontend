import React from "react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { MediaPlayer, MediaProvider, Poster, VideoSrc } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import "./videoplayer.css";

export const VideoPlayer = ({
  title,
  src,
  poster,
}: {
  title: string;
  src: string | VideoSrc | VideoSrc[];
  poster?: string;
}) => (
  <MediaPlayer
    title={title}
    src={src}
    poster={poster}
    aspectRatio="16/9"
    className={"rounded-b-none! rounded-t-lg!"}
  >
    <MediaProvider>
      <Poster className="vds-poster" src={poster} />
    </MediaProvider>
    <DefaultVideoLayout
      icons={defaultLayoutIcons}
      colorScheme={"system"}
      className={"[&>*]:rounded-b-none! [&>*]:rounded-t-lg!"}
    />
  </MediaPlayer>
);

export default VideoPlayer;
