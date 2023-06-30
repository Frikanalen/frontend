import * as Progress from "@radix-ui/react-progress"
import React, { useCallback, useState } from "react"
import { useCookie } from "react-use"
import { useTus } from "use-tus"

import "regenerator-runtime/runtime"

import { UploadFileSelector } from "./uploadFileSelector"
import { Maybe } from "../../generated/graphql"
import getConfig from "next/config"
const { publicRuntimeConfig } = getConfig()

const UploadProgressBar = ({ progress }: { progress: number }) => (
  <Progress.Root max={100} value={progress} className={" h-9 relative"}>
    <div className={"absolute z-40 inset-1 text-center h-full font-semibold text-white mix-blend-exclusion"}>
      {progress.toFixed(2)}%
    </div>
    <Progress.Indicator className={"z-20 inset-0 h-9 overflow-hidden rounded-full absolute"}>
      <div
        className={"w-full h-9 bg-gradient-to-br from-green-600 to-green-900 relative"}
        style={{
          transform: `translateX(-${100 - progress}%)`,
          transition: "transform 660ms cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      />
    </Progress.Indicator>
    <div className={"w-full z-0  h-9 bg-gradient-to-br rounded-full from-gray-400 to-gray-300 relative"} />
  </Progress.Root>
)

interface VideoFileUploadProps {
  onComplete: (mediaId: string) => void
}

const VideoUploadError = () => (
  <div className={"flex h-full items-center"}>
    <div className={"text-5xl font-semibold border-black"}>Beklager, en feil har oppstått!</div>
  </div>
)

export const VideoCreationUpload = ({ onComplete }: VideoFileUploadProps) => {
  const { upload, setUpload, error } = useTus({ autoStart: true })
  const [csrfToken] = useCookie("fk-csrf")
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const handleSetUpload = useCallback(
    (file?: Maybe<File>) => {
      if (!file) return

      setUpload(file, {
        endpoint: publicRuntimeConfig.FK_API + "/upload/video",
        onBeforeRequest: (req) => {
          if (!csrfToken) throw new Error("Cannot upload without CSRF token!")
          const xhr = req.getUnderlyingObject() as XMLHttpRequest
          xhr.withCredentials = true
          xhr.setRequestHeader("X-CSRF-Token", csrfToken)
        },
        onProgress: (bytesSent, bytesTotal) => {
          setUploadProgress((bytesSent / bytesTotal) * 100)
        },
        chunkSize: 2 ** 23, // Node throws a server-side exception if larger
        onAfterResponse: (req: any) => {
          const xhr = req.getUnderlyingObject() as XMLHttpRequest
          // Kludge to get an onSuccess which also reads mediaId/jobId
          // The last PATCH will return 200, others return 204 No Content
          if (req._method === "PATCH" && xhr.status === 200) {
            const { mediaId } = JSON.parse(xhr.responseText)
            onComplete(mediaId.toString())
          }
        },
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
      })
    },
    [setUpload, csrfToken, onComplete]
  )

  if (!csrfToken) return null

  return (
    <div className={"text-green-900 bg-green-100 rounded-2xl w-full h-full p-2"}>
      <div
        className={
          "p-2 w-full " +
          "transition appearance-none hover:border-green-500 " +
          "border-[5px] border-green-600 rounded-2xl border-dashed"
        }
      >
        <UploadFileSelector handleStart={handleSetUpload} />
        {error ? <VideoUploadError /> : upload && <UploadProgressBar progress={uploadProgress} />}
      </div>
    </div>
  )
}
