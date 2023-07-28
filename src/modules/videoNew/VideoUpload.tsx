import FileDownloadDoneRoundedIcon from "@mui/icons-material/FileDownloadDoneRounded"
import React, { useCallback, useState } from "react"
import { Upload } from "./upload"
import { Processing } from "./Processing"

const VideoUploadDone = () => (
  <div className={"flex h-full items-center"}>
    <div className={"text-5xl font-semibold border-black"}>
      <FileDownloadDoneRoundedIcon sx={{ fontSize: "inherit", marginRight: ".25em", marginBottom: ".125em" }} />
      ferdig
    </div>
  </div>
)
export const VideoUpload = ({ onJobCreated }: { onJobCreated: (mediaId: number, uploadId: string) => void }) => {
  const [isProcessed, setIsProcessed] = useState<boolean>(false)
  const [uploadId, setUploadId] = useState<string>()
  const onCompleted = useCallback(() => setIsProcessed(true), [setIsProcessed])

  return (
    <>
      {!uploadId ? (
        <Upload onComplete={setUploadId} />
      ) : !isProcessed ? (
        <Processing uploadId={uploadId} onComplete={onCompleted} onJobCreated={onJobCreated} />
      ) : (
        <VideoUploadDone />
      )}
    </>
  )
}
