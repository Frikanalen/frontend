import { useCookie } from "react-use"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTus } from "use-tus"
import { Maybe } from "../../generated/graphql"

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
