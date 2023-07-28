"use client"
import * as Progress from "@radix-ui/react-progress"
import React from "react"

import "regenerator-runtime/runtime"

import { FileSelector } from "./fileSelector"
import { useUpload } from "./useUpload"

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

export const Upload = ({ onComplete }: VideoFileUploadProps) => {
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
        <FileSelector handleStart={handleSetUpload} />
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
