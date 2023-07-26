import getConfig from "next/config"
import { useEffect, useState } from "react"

// TODO: Replace hackish sleep with a proper solution
export const useMediaProcessorStatus = (
  uploadId: string,
  onComplete: () => void,
  onMediaId: (mediaId: number) => void
) => {
  const { FK_MEDIAPROC } = getConfig().publicRuntimeConfig
  const [percent, setPercent] = useState<number>(0)
  const [status, setStatus] = useState<"pending" | "connected" | "error">("pending")
  useEffect(() => {
    // sleep 1 second to allow the job to be created (yeah, it's a hack...)
    new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
      const source = new EventSource(`${FK_MEDIAPROC}/status/${uploadId}`, { withCredentials: true })
      source.onopen = (e) => {
        setStatus("connected")
      }
      source.addEventListener("progress", (e) => {
        const { percent } = JSON.parse(e.data)
        setPercent(percent)
      })
      source.addEventListener("status", (e) => {
        const { mediaId } = JSON.parse(e.data)
        onMediaId(mediaId)
      })
      source.addEventListener("completed", (e) => {
        onComplete()
      })
      source.onmessage = console.warn
      source.onerror = (e) => {
        console.log(e)
      }
      return () => source.close()
    })
  }, [])

  return { percent, status }
}
