import videojs from "video.js"
import "video.js/dist/video-js.min.css"

import { useEffect, useRef } from "react"
import type VideoJsPlayer from "video.js/dist/types/player"


interface VideoJSProps {
  options: any,
  onReady?: (player: any) => void
}

export const VideoJS = ({ options, onReady }: VideoJSProps) => {
  const videoRef = useRef(null)
  const playerRef = useRef<VideoJsPlayer | null>(null)

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = videoRef.current

      if (!videoElement) return

      const player = (playerRef.current = videojs(videoElement, options, () => {
        onReady && onReady(player)
      }))

      // You can update player in the `else` block here, for example:
    } else {
      playerRef.current.autoplay(true)
    }
  }, [options, videoRef, onReady])

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  return <video ref={videoRef} className="video-js vjs-big-play-centered" />
}

export type LiveVideoPlayerProps = {
  src: string
  className?: string
}

export const LiveVideoPlayer = ({ className, src }: LiveVideoPlayerProps) => (
  <div className={className}>
    <VideoJS
      options={{
        fluid: true,
        html5: { vhs: { overrideNative: true } },
        controls: true,
        sources: [{ src, type: "application/x-mpegURL" }],
      }}
    />
  </div>
)

export default LiveVideoPlayer
