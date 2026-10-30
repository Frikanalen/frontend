"use client";
import dynamic from "next/dynamic";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { NowNextOverlay } from "@/components/stream/nowNextOverlay";

const VideoPlayer = dynamic(() => import("@/components/stream/VideoPlayer"), {
  ssr: false,
});

export const Live = ({ schedule }: { schedule: ScheduleitemRead[] }) => {
  return (
    <div className="flex w-full flex-col gap-4 overflow-hidden rounded-lg">
      <VideoPlayer
        title="Frikanalen direkte"
        src="/stream/index.m3u8"
        overlay={<NowNextOverlay schedule={schedule} />}
      />
    </div>
  );
};
