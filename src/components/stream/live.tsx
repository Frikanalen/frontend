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
      <Card className={"bg-green-200/15  dark:bg-green-900 rounded-lg"}>
        <VideoPlayer
          title="Frikanalen direkte"
          src="https://frikanalen.no/stream/index.m3u8"
        />
        <CardBody>
          <p className={"p-2"}>
            <em>
              Medlemmet er selv ansvarlig for innholdet i deres sendinger.
            </em>
          </p>
          <MetadataCurrentAndNext schedule={schedule} />
        </CardBody>
      </Card>
    </div>
  );
};
