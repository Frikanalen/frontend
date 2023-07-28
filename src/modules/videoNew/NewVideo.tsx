"use client"
import React from "react"
import { useQuery } from "@apollo/client"
import { GetOrganizationDocument, Maybe } from "../../generated/graphql"
import { RequireUserIsEditor } from "../../refactor/requireUserIsEditor"
import { OrganizationPageParams } from "../../pages/organization/[orgId]"
import { GetServerSideProps } from "next"
import { VideoCreationForm } from "src/modules/forms/VideoCreationForm"
import { useRouter } from "next/router"

export interface UploadPageProps {
  orgId: Maybe<string>
}

export const NewVideo = ({ orgId }: UploadPageProps) => {
  const { data } = useQuery(GetOrganizationDocument, { variables: { orgId: orgId! }, skip: !orgId })
  const router = useRouter()

  if (!data) return null

  const { organization } = data

  return (
    <RequireUserIsEditor organization={organization}>
      <h3 className="text-3xl bg-gradient-to-b from-green-800 to-green-900 font-bold text-green-200 px-8 py-5">
        Ny video for {organization.name}
      </h3>
      <div className={"bg-gradient-to-t from-green-500 to-green-400 text-black p-8"}>
        <VideoCreationForm
          organizationId={organization.id}
          onCreated={(videoId, uploadId) =>
            router.push({
              pathname: `/video/[videoId]`,
              query: { videoId, uploadId },
            })
          }
        />
      </div>
    </RequireUserIsEditor>
  )
}

export const getServerSideProps: GetServerSideProps<UploadPageProps> = async ({ params }) => {
  const { orgId } = params as OrganizationPageParams

  return { props: { orgId } }
}

export default NewVideo
