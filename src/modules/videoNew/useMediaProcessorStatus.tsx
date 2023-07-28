"use client"
import { useEffect, useState, useRef } from "react"

export const useMediaProcessorStatus = (
  uploadId: string,
  onComplete?: () => void,
  onJobCreated?: (mediaId: number) => void,
) => {
  const [percent, setPercent] = useState<number>(0)
  const [status, setStatus] = useState<"pending" | "connected" | "error" | "completed">("pending")
  const setRetryCount = useState<number>(0)[1]
  const sRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const mediaprocUrl = process.env.NEXT_PUBLIC_FK_MEDIAPROC

    const connect = () => {
      sRef.current?.close() // Ensure any existing connection is closed before creating a new one
      const s = new EventSource(`${mediaprocUrl}/status/${uploadId}`, { withCredentials: true })
      sRef.current = s
      s.onopen = () => {
        setStatus("connected")
        setRetryCount(0)
      }
      s.onerror = () => {
        setRetryCount((prevRetryCount) => {
          if (prevRetryCount < 10) {
            setTimeout(connect, 1000)
            return prevRetryCount + 1
          } else {
            console.error("Media processing failed (onerror event)")
            setStatus("error")
            return prevRetryCount
          }
        })
      }
      s.addEventListener("status", ({ data }) => {
        const { mediaId, isCompleted, isActive, isFailed } = JSON.parse(data)
        if (isCompleted) {
          setStatus("completed")
          onJobCreated && mediaId && onJobCreated(mediaId)
          onComplete && onComplete()
        } else if (isActive) {
          setPercent(0)
          setStatus("connected")
        } else if (isFailed) {
          console.error("Media processing failed (status event)")
          setStatus("error")
        }
      })
      s.addEventListener("progress", ({ data }) => setPercent(JSON.parse(data).percent))
      onJobCreated && s.addEventListener("status", ({ data }) => onJobCreated(JSON.parse(data).mediaId))
      s.addEventListener("completed", () => {
        setStatus("completed")
        onComplete && onComplete()
      })
    }

    connect()

    return () => sRef.current?.close() // Close the current EventSource instance when the component is unmounted
  }, [uploadId, onComplete, onJobCreated, setRetryCount])

  return { percent, status }
}
