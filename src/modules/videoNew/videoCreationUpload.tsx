"use client"
import * as Progress from "@radix-ui/react-progress"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useCookie } from "react-use"
import { useTus } from "use-tus"

import "regenerator-runtime/runtime"

import { UploadFileSelector } from "./uploadFileSelector"
import { Maybe } from "../../generated/graphql"

export const UploadProgressBar = ({ progress }: { progress: number }) => (
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
  onComplete: (uploadId: string) => void
}

export const useUpload = (onComplete: (uploadId: string) => void) => {
  const [csrfToken] = useCookie("fk-csrf")
  const [progress, setProgress] = useState<number>(0)
  const { upload, setUpload, error } = useTus({ autoStart: true })

  const uploadId = useMemo((): string => {
    if (!upload?.url) return ""
    const id = new URL(upload.url).pathname.split("/").pop() ?? ""
    if (!id.length) throw new Error("Upload ID is empty")
    return id
  }, [upload?.url])

  const onSuccess = useCallback(() => onComplete(uploadId), [onComplete, uploadId])

  // Clear all localStorage keys starting with "tus::"
  useEffect(() => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("tus::"))
      .forEach((key) => localStorage.removeItem(key))
  }, [])

  const handleSetUpload = useCallback(
    (file?: Maybe<File>) => {
      if (!file) return

      setUpload(file, {
        onProgress: (bytesSent, bytesTotal) => {
          setProgress((bytesSent / bytesTotal) * 100)
        },
        endpoint: `${process.env.NEXT_PUBLIC_FK_UPLOAD}`,
        chunkSize: 2 ** 23, // Node throws a server-side exception if larger
        onBeforeRequest: (req) => {
          if (!csrfToken) throw new Error("Cannot upload without CSRF token!")
          const xhr = req.getUnderlyingObject() as XMLHttpRequest
          xhr.withCredentials = true
          xhr.setRequestHeader("X-CSRF-Token", csrfToken)
        },
        onSuccess,
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
      })
    },
    [setUpload, csrfToken, onSuccess],
  )

  return {
    handleSetUpload,
    progress,
    upload,
    error,
  }
}

export const VideoCreationUpload = ({ onComplete }: VideoFileUploadProps) => {
  const { handleSetUpload, error, upload, progress } = useUpload(onComplete)

  if (error) console.error(error)
  return (
    <div className={"text-green-900 bg-green-100 rounded-2xl p-2"}>
      <div
        className={
          "p-2 w-full  " +
          "border-[5px] border-green-600 rounded-2xl border-dashed " +
          "transition appearance-none hover:border-green-500"
        }
      >
        <UploadFileSelector handleStart={handleSetUpload} />
        {error ? (
          <div>
            <div className={"text-center text-2xl font-semibold"}>Beklager, en feil har oppstått!</div>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </div>
        ) : (
          upload && <UploadProgressBar progress={progress ?? 0} />
        )}
      </div>
    </div>
  )
}
