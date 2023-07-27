import getConfig from "next/config"
import { useEffect, useState } from "react"
import { useTimeout } from "usehooks-ts"

// TODO: Replace hackish sleep with a proper solution and rely less on callbacks
export const useMediaProcessorStatus = (
  uploadId: string,
  onComplete: () => void,
  onMediaId: (mediaId: number) => void,
) => {
  const [percent, setPercent] = useState<number>(0)
  const [status, setStatus] = useState<"pending" | "connected" | "error">("pending")
  // sleep 1 second to allow the job to be created (yeah, it's a hack...)
  const [skip, setSkip] = useState<boolean>(true)
  useTimeout(() => setSkip(false), 500)

  useEffect(() => {
    if (skip) return

    const { FK_MEDIAPROC } = getConfig().publicRuntimeConfig
    const source = new EventSource(`${FK_MEDIAPROC}/status/${uploadId}`, { withCredentials: true })
    source.onopen = () => setStatus("connected")
    source.onerror = console.log
    source.addEventListener("progress", ({ data }) => setPercent(JSON.parse(data).percent))
    source.addEventListener("status", ({ data }) => onMediaId(JSON.parse(data).mediaId))
    source.addEventListener("completed", onComplete)

    return () => source.close()
  }, [skip, setPercent, onMediaId, onComplete, uploadId])

  return { percent, status }
}
