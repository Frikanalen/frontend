"use client";
import dynamic from "next/dynamic";
import { LiveBadge } from "@/components/stream/nowNextOverlay";

const VideoPlayer = dynamic(() => import("@/components/stream/VideoPlayer"), {
  ssr: false,
});

export const Live = () => (
  <div className="w-full overflow-hidden rounded-xs">
    <VideoPlayer title="Frikanalen direkte" src="/stream/index.m3u8" overlay={<LiveBadge />} />
  </div>
);
