import { VideoPlayer } from "src/modules/video/components/VideoPlayer"
import React from "react"
import { Meta } from "src/modules/core/components/Meta"
import { GetVideoDocument, GetVideoQuery } from "../../generated/graphql"
import { VideoPageMetaBar } from "../../modules/video/components/videoPageMetaBar"
import { LatestVideosSidebar } from "../../modules/video/components/latestVideosSidebar"
import { GetServerSideProps } from "next"
import assert from "assert"
import { client } from "../../modules/apollo/client"
import { ParsedUrlQuery } from "querystring"
import { useQuery } from "@apollo/client"
import { Alert } from "@mui/material"
import { get } from "react-hook-form"

export interface VideoPageParams extends ParsedUrlQuery {
  videoId: string
}

interface VideoPageProps {
  videoId: string,
  videoSSR: GetVideoQuery["video"]["get"] | null
}

export const VideoPage = ({ videoSSR, videoId }: VideoPageProps) => {
  const { data } = useQuery(GetVideoDocument, { variables: { videoId } })

  const video = data?.video?.get || videoSSR

  if (!video) return <Alert severity="error">Video is not published</Alert>

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
        <VideoPlayer video={video} />
        <VideoPageMetaBar video={video} />
      </div>
      <LatestVideosSidebar className={"lg:basis-1/3 grow-0 shrink-0 drop-shadow-md"} latestVideos={video.organization} />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<VideoPageProps> = async (ctx) => {
  const { videoId } = ctx.params as VideoPageParams

  assert(videoId)

  try {
    const {
      data: {
        video: { get },
      },
    } = await client.query({ query: GetVideoDocument, variables: { videoId: videoId as string } })

    return { props: { videoSSR: get, videoId } }
  }
  catch (e) {
    return {
      props: { videoSSR: null, videoId }
    }
  }
}

export default VideoPage
