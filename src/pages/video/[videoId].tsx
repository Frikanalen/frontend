import { VideoPlayer } from "src/modules/video/components/VideoPlayer"
import React from "react"
import { Meta } from "src/modules/core/components/Meta"
import { VideoPageMetaBar } from "../../modules/video/components/videoPageMetaBar"
import { LatestVideosSidebar } from "../../modules/video/components/latestVideosSidebar"
import { ParsedUrlQuery } from "querystring"
import { Alert } from "@mui/material"
import { useGetVideosId } from "src/generated/video/video"
import { useRouter } from "next/router"

export interface VideoPageParams extends ParsedUrlQuery {
  videoId: string
}

export const VideoPage = () => {
  const router = useRouter()
  const videoId = parseInt(router.query.videoId as string)
  const { data: video } = useGetVideosId(videoId)

  if (isNaN(videoId)) return null

  if (!video) return <Alert severity="error">Videoen finnes ikke</Alert>

  return (
    <div className={"flex gap-5 flex-col lg:flex-row w-full"}>
      <Meta
        meta={{
          title: video.title,
          description: video.description,
          author: video.organization.name,
        }}
      />
      <div className={"bg-green-800 drop-shadow-2xl h-fit grow"}>
        <VideoPlayer videoId={videoId} />
        <VideoPageMetaBar videoId={videoId} />
      </div>
      <LatestVideosSidebar
        className={"lg:basis-1/3 grow-0 shrink-0 drop-shadow-md"}
        organizationId={video.organization.id}
      />
    </div>
  )
}

export default VideoPage
