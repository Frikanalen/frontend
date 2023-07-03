import React from "react"
import { getAssetURI } from "../getAssetURI"
import { VideoJS } from "../../frontpage/LiveVideoPlayer"
import { useGetVideosId } from "src/generated/video/video"

// This just went away for some reason
type SourceObject = object

const FORMATS = [
  { assetType: "hls", type: "application/vnd.apple.mpegurl" },
  { assetType: "webm", type: "video/webm" },
  { assetType: "theora", type: "video/ogg" },
] as const

export type VideoPlayerProps = {
  className?: string
  videoId: number
}

export const useLargeThumbnail = (videoId: number) => {
  const { data: video } = useGetVideosId(videoId)
  if (!video) return null;

  const thumbnail = video.media.assets.find(({ type }) => type === "thumbnail-large")
  if (!thumbnail) return null
  return thumbnail.url
}

export const VideoPlayer = ({ className, videoId }: VideoPlayerProps) => {
  const { data: video } = useGetVideosId(videoId)
  const poster = useLargeThumbnail(videoId)

  if (!video) return null;

  const sources: SourceObject[] = FORMATS
    .map(({ assetType, type }) => ({
      src: getAssetURI(video.media.assets, assetType)!,
      type,
    })
    )
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
            poster,
            liveui: false,
            sources,
          }}
        />
      </div>
    </div>
  )
}
