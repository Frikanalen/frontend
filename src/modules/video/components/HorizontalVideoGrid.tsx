import { EmptyState } from "src/modules/ui/components/EmptyState"
import { LatestVideosFragment } from "../../../generated/graphql"
import Link from "next/link"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { VideoThumbnail } from "../../../pages/video"

export type VideoGridProps = {
  videos?: LatestVideosFragment["latestVideos"]
}

export function HorizontalVideoGrid({ videos }: VideoGridProps) {
  if (!videos) return null
  if (!videos.length) return <EmptyState title="Ingen videoer enda" icon="film" />

  return (
    <div className={"flex gap-4 flex-nowrap"}>
      {videos.map(({ id, title, createdAt, description, published }) => (
        <div key={id} className={"w-56 h-64 border-2 border-gray-700 rounded-md"}>
          <div className={"flex p-2 h-full flex-col justify-between"}>
            <Link href={`/video/${id}`} passHref>
              <VideoThumbnail videoId={parseInt(id)} />
              <div className={"pt-2"}>{title}</div>
            </Link>
            {!published && <div className={"rounded-lg bg-black text-white font-bold p-2 italic"}>Ikke publisert</div>}
            <div className={"overflow-hidden text-xs"}>{description}</div>
            <div>lastet opp {format(new Date(createdAt), "d. MMM yyyy", { locale: nb })}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
