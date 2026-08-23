"use client";
import dynamic from "next/dynamic";
import { Card } from "@heroui/react";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { NowNextOverlay } from "@/components/stream/nowNextOverlay";

const VideoPlayer = dynamic(() => import("@/components/stream/VideoPlayer"), {
  ssr: false,
});

export const Live = ({ schedule }: { schedule: ScheduleitemRead[] }) => {
  return (
    <div className="flex flex-col gap-4">
      <Card className={"bg-background text-primary rounded-lg"}>
        <VideoPlayer
          title="Frikanalen direkte"
          src="/stream/index.m3u8"
          overlay={<NowNextOverlay schedule={schedule} />}
        />
      </Card>
    </div>
  );
};
