import React, { useCallback } from "react"
import { useMediaProcessorStatus } from "./useMediaProcessorStatus"
import { UploadProgressBar } from "./upload"

export const Processing = ({
  uploadId,
  onJobCreated,
  onComplete,
}: {
  uploadId: string
  onJobCreated: (mediaId: number, uploadId: string) => void
  onComplete: () => void
}) => {
  const jobCreated = useCallback((mediaId: number) => onJobCreated(mediaId, uploadId), [onJobCreated, uploadId])
  const { percent, status } = useMediaProcessorStatus(uploadId, onComplete, jobCreated)

  if (status !== "error")
    return (
      <div>
        <div className={"text-2xl font-semibold"}>Etterbehandler video...</div>
        <UploadProgressBar progress={percent ?? 0} />
      </div>
    )
  else return <div>Det skjedde en feil under opplastingen</div>
}
