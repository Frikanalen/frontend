import getConfig from "next/config"
import { useEffect, useState } from "react"

export const useMediaProcessorStatus = (
  uploadId: string,
  onComplete: () => void,
  onMediaId: (mediaId: number) => void,
) => {
  const [percent, setPercent] = useState<number>(0)
  const [status, setStatus] = useState<"pending" | "connected" | "error">("pending")

  useEffect(() => {
    const { FK_MEDIAPROC } = getConfig().publicRuntimeConfig

    const s = new EventSource(`${FK_MEDIAPROC}/status/${uploadId}`, { withCredentials: true })
    s.onopen = () => setStatus("connected")
    s.onerror = console.log
    s.addEventListener("progress", ({ data }) => setPercent(JSON.parse(data).percent))
    s.addEventListener("status", ({ data }) => onMediaId(JSON.parse(data).mediaId))
    s.addEventListener("completed", onComplete)

    return () => s.close()
  }, [uploadId, onComplete, onMediaId])

  return { percent, status }
}
