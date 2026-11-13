"use client";
import { useEffect, useRef } from "react";

/** A video element playing a WebRTC stream; muted, as autoplay requires. */
export const StreamVideo = ({
  stream,
  className,
  controls = true,
  label,
}: {
  stream: MediaStream | null;
  className?: string;
  controls?: boolean;
  label: string;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <video
      aria-label={label}
      autoPlay
      className={className}
      controls={controls}
      muted
      playsInline
      ref={ref}
    />
  );
};
