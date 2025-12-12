"use client";
import dynamic from "next/dynamic";
import { Card, CardBody } from "@heroui/react";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { MetadataCurrentAndNext } from "@/components/stream/metadataCurrentAndNext";

const VideoPlayer = dynamic(() => import("@/components/stream/VideoPlayer"), {
  ssr: false,
});

export const Live = ({ schedule }: { schedule: ScheduleitemRead[] }) => {
  return (
    <div className="flex flex-col gap-4">
      <Card className={"bg-background text-primary rounded-lg"}>
        <VideoPlayer title="Frikanalen direkte" src="/stream/index.m3u8" />
        <CardBody>
          <p className={"p-2 text-foreground"}>
            <em>Medlemmet er selv ansvarlig for innholdet i sine sendinger.</em>
          </p>
          <MetadataCurrentAndNext schedule={schedule} />
        </CardBody>
      </Card>
    </div>
  );
};
