import { SearchFunction } from "../../refactor/searchFunction"
import Link from "next/link"
import { format } from "date-fns"
import nb from "date-fns/locale/nb"
import cx from "classnames"
import { Alert } from "@mui/material"
import { useGetVideos, useGetVideosId } from "src/generated/video/video"
import { getLargeThumbnail } from "src/modules/video/components/VideoPlayer"
const logger = require('pino')()

export const formatVideoDuration = (seconds?: number | null): string => {
  if (!seconds) return ""

  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return hrs ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const VideoThumbnail = ({
  videoId,
  className,
}: {
  videoId: number,
  className?: string
}) => {
  const { data: video } = useGetVideosId(videoId)
  if (!video) return null;

  return (
    <div className={cx("relative", className)}>
      <div className={"absolute bg-gray-800/50 leading-4 p-1 right-0 bottom-0 m-1 text-white"}>
        {formatVideoDuration(video.duration)}
      </div>
      <div className="aspect-video flex bg-black justify-center" >
        <img alt={""} src={getLargeThumbnail(videoId) ?? ""} />
      </div>
    </div>
  )
}

const VideoCard = ({ videoId }: { videoId: number }) => {
  const { data: video } = useGetVideosId(videoId)
  if (!video) return null;

  return (
    <Link href={`/video/${video.id}`} className={"snap-start"}>
      <div className={"bg-black/60 rounded-md w-52 h-full"}>
        <VideoThumbnail videoId={video.id} />
        <div className={"p-2"}>
          <div className={"font-bold text-white/80"}>{video.title}</div>
          <div className={"font-bold text-white/70"}>{video.organization.name}</div>
          <div className={"text-white/70"}>{format(new Date(video.createdAt), "d MMMM yyyy", { locale: nb })}</div>
        </div>
      </div>
    </Link>
  )
}

const NewestVideos = ({ className }: { className?: string }) => {
  const { data, error } = useGetVideos({ limit: 15 })

  if (!data) return null
  const videos = data.rows

  if (error) {
    logger.error('fetching newest videos', error)
    return <Alert severity={"error"}>Kunne ikke hente nyeste videoer</Alert>
  }

  return (
    <div className={cx(className, "p-4 border-orange-300 bg-white/40 border-4 space-y-2 rounded-xl shadow-lg w-full")}>
      <div className={"text-3xl font-bold text-black/95"}>Nyeste videoer</div>
      <div className={"flex gap-4 pb-2 overflow-x-scroll scroll-x-smooth snap-x horizontal-list"}>
        {videos?.map((v) => v && <VideoCard key={v.id} videoId={v.id} />)}
      </div>
    </div>
  )
}

export const ArchivePage = ({ children }: { children: React.ReactNode }) => (
  <div className={"space-y-4"}>
    <SearchFunction className={"drop-shadow-xl relative z-20"} />
    <div className={"scroll-m-0 gap-8 flex flex-row"}>{children}</div>
  </div>
)

export const ArchiveHome = () => {
  return (
    <ArchivePage>
      <NewestVideos className={"drop-shadow-md grow"} />
    </ArchivePage>
  )
}

export default ArchiveHome
