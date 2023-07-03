import { format } from "date-fns"
import { nb } from "date-fns/locale"
import React from "react"
import { useRouter } from "next/router"
import { VideoThumbnail } from "../../../pages/video"
import { useGetVideosId } from "src/generated/video/video"

export type RecentVideoItemProps = {
  videoId: number
}

export const RecentVideoItem = ({ videoId }: RecentVideoItemProps) => {
  const { data: video } = useGetVideosId(videoId)
  const router = useRouter()

  if (!video) return null;

  const { id, title, createdAt } = video

  return (
    <div className={"bg-white cursor-pointer "} onClick={() => router.push(`/video/${id}`)}>
      <div className={"flex items-between"}>
        <VideoThumbnail className={"basis-40 flex-none"} videoId={videoId} />
        <div className={"pl-2 flex flex-col justify-between max-h-full"}>
          <h3 className={"font-bold text-md text-slate-900 overflow-hidden "}>
            <a>{title}</a>
          </h3>
          <div className={"text-slate-500"}>{format(new Date(createdAt), "d. MMM yyyy", { locale: nb })}</div>
        </div>
      </div>
    </div>
  )
}
