import { RecentVideoItem } from "./RecentVideoItem"
import React from "react"
import Link from "next/link"
import { useGetVideos } from "src/generated/video/video"
import { useGetOrganizationsId } from "src/generated/organization/organization"

interface LatestVideosSidebarProps {
  className?: string
  organizationId: number
}

const LatestVideosHeading = ({ id, name }: { id: number; name: string }) => (
  <div className={"lg:mx-3 lg:mb-4 p-4 bg-gradient-to-b from-red-700 to-red-900 text-white"}>
    <h3 className={"text-xl lg:text-3xl text-white mix-blend-luminosity opacity-90 font-bold"}>Nyeste videoer</h3>
    <h5 className="text-md lg:text-2xl text-white mix-blend-luminosity opacity-80 font-semibold lg:pb-1 ">
      <span className={"font-semibold text-gray-300"}>fra </span>
      <Link className={"font-bold"} href={`/organization/${id}`} passHref>
        {name}
      </Link>
    </h5>
  </div>
)

export const LatestVideosSidebar = ({
  className,
  organizationId
}: LatestVideosSidebarProps) => {
  const { data: organization } = useGetOrganizationsId(organizationId)
  const { data: latestVideos } = useGetVideos({ organization: organizationId, limit: 5 })

  if (!organization) return null

  const { id, name } = organization

  return (
    <div className={className}>
      <LatestVideosHeading id={id} name={name} />
      <div className="flex flex-col lg:gap-4 lg:px-3 ">
        {latestVideos?.rows?.map((x) => (
          <RecentVideoItem key={x.id} videoId={x.id} />
        ))}
      </div>
    </div>
  )
}