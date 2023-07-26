import React, { useState } from "react"
import { useQuery } from "@apollo/client"
import { GetOrganizationDocument, Maybe } from "../../generated/graphql"
import { RequireUserIsEditor } from "../../refactor/requireUserIsEditor"
import { UploadProgressBar, VideoCreationUpload } from "./videoCreationUpload"
import { OrganizationPageParams } from "../../pages/organization/[orgId]"
import { GetServerSideProps } from "next"
import { VideoCreationForm } from "src/modules/forms/VideoCreationForm"
import FileDownloadDoneRoundedIcon from "@mui/icons-material/FileDownloadDoneRounded"
import { useMediaProcessorStatus } from "./useMediaProcessorStatus"
import { useRouter } from "next/router"

export interface UploadPageProps {
  orgId: Maybe<string>
}

const VideoUploadDone = () => (
  <div className={"flex h-full items-center"}>
    <div className={"text-5xl font-semibold border-black"}>
      <FileDownloadDoneRoundedIcon sx={{ fontSize: "inherit", marginRight: ".25em", marginBottom: ".125em" }} />
      ferdig
    </div>
  </div>
)

export const VideoUpload = ({ onMediaId }: { onMediaId: (mediaId: number) => void }) => {
  const [isProcessed, setIsProcessed] = useState<boolean>(false)
  const [uploadId, setUploadId] = useState<string>()
  return (
    <>
      {!uploadId ? (
        <VideoCreationUpload onComplete={setUploadId} />
      ) : !isProcessed ? (
        <VideoProcessingProgress uploadId={uploadId} onComplete={() => setIsProcessed(true)} onMediaId={onMediaId} />
      ) : (
        <VideoUploadDone />
      )}
    </>
  )
}

const VideoProcessingProgress = ({
  uploadId,
  onMediaId,
  onComplete,
}: {
  uploadId: string
  onMediaId: (mediaId: number) => void
  onComplete: () => void
}) => {
  const { percent } = useMediaProcessorStatus(uploadId, onComplete, onMediaId)
  return (
    <div>
      <div className={"text-2xl font-semibold"}>Etterbehandler video...</div>
      <UploadProgressBar progress={percent ?? 0} />
    </div>
  )
}

export const UploadVideoDialog = ({ orgId }: UploadPageProps) => {
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
        <VideoCreationForm organizationId={organization.id} onCreated={(videoId) => router.push(`/video/${videoId}`)} />
      </div>
    </RequireUserIsEditor>
  )
}

export const getServerSideProps: GetServerSideProps<UploadPageProps> = async ({ params }) => {
  const { orgId } = params as OrganizationPageParams

  return { props: { orgId } }
}

export default UploadVideoDialog
