import React from "react"
import { Video } from "../../../generated/graphql"
import { getAssetURI } from "../getAssetURI"
import { VideoJS } from "../../frontpage/LiveVideoPlayer"

// This just went away for some reason
type SourceObject = object

export type VideoPlayerProps = {
  className?: string
  video: Pick<Video, "assets" | "images" | "duration">
}

export function VideoPlayer({ className, video }: VideoPlayerProps) {
  const formats = [
    { assetType: "hls", type: "application/vnd.apple.mpegurl" },
    { assetType: "webm", type: "video/webm" },
    { assetType: "theora", type: "video/ogg" },
  ]

  const sources: SourceObject[] = formats
    .map(({ assetType, type }) => {
      const src = getAssetURI(video.assets, assetType)!

      return {
        src,
        type,
      }
    })
    .filter(({ src }) => src)
  if (!video) return null

  return (
    <div className={className}>
      <div className={"aspect-video w-full bg-black/75"}>
        <VideoJS
          options={{
            fluid: true,
            html5: { vhs: { overrideNative: true } },
            controls: true,
            poster: video.images.thumbLarge,
            liveui: false,
            sources,
          }}
        />
      </div>
    </div>
  )
}
