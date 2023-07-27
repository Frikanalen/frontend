import React from "react"
import { getAssetURI } from "../getAssetURI"
import { VideoJS } from "../../frontpage/LiveVideoPlayer"
import { useGetVideosId } from "src/generated/video/video"
import { useMediaProcessorStatus } from "src/modules/videoNew/useMediaProcessorStatus"
import { useRouter } from "next/router"
import { number } from "nope-validator"

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
  if (!video) return null

  const thumbnail = video.media.assets.find(({ type }) => type === "thumbnail-large")
  if (!thumbnail) return null
  return thumbnail.url
}

const PendingVideoWindow = ({ videoId }: { videoId: number }) => {
  const thumbnail = useLargeThumbnail(videoId)

  const router = useRouter()
  const uploadId = router.query.uploadId as string
  const { percent, status } = useMediaProcessorStatus(uploadId)

  // If it's done, we remove "uploadId" from the URL
  if (status === "completed") router.replace(router.asPath.split("?")[0])

  return (
    <div className={"flex h-full relative"}>
      <div className={`absolute`} style={{ filter: `blur(${(100 - percent) / 3}px)` }}>
        <img src={thumbnail!} />
      </div>
      <div className="relative flex flex-col w-full items-center justify-center bg-green-200/10">
        <div className="flex flex-col gap-4 items-center">
          <div className="text-xl">Videoen behandles</div>
          <div className="text-2xl font-bold font-mono">&nbsp;{percent.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  )
}

export const VideoPlayer = ({ className, videoId }: VideoPlayerProps) => {
  const { data: video } = useGetVideosId(videoId)
  const poster = useLargeThumbnail(videoId)

  const router = useRouter()
  const uploadId = router.query.uploadId as string

  if (!video) return null

  const sources: SourceObject[] = FORMATS.map(({ assetType, type }) => ({
    src: getAssetURI(video.media.assets, assetType)!,
    type,
  })).filter(({ src }) => src)

  return (
    <div className={className}>
      <div className={"aspect-video w-full bg-black/75"}>
        {uploadId ? (
          <PendingVideoWindow videoId={videoId} />
        ) : (
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
        )}
      </div>
    </div>
  )
}
