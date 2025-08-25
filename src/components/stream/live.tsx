"use client";
// import dynamic from "next/dynamic";
import { Card, CardBody } from "@heroui/react";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { MetadataCurrentAndNext } from "@/components/stream/metadataCurrentAndNext";
import { Alert } from "@heroui/alert";

// const VideoPlayer = dynamic(() => import("@/components/stream/VideoPlayer"), {
//   ssr: false,
// });

export const Live = ({ schedule }: { schedule: ScheduleitemRead[] }) => {
  return (
    <div className="flex flex-col gap-4">
      <Card className={"bg-background text-primary rounded-lg"}>
        <Alert color={"danger"} className={"aspect-video"}>
          <div className={"max-w-xl prose dark:prose-invert prose-xl"}>
            <h2>Strømbrudd</h2>
            <p>
              Frikanalen er rammet av strømbrudd i et maskinrom som dessverre gjør oss ute av stand
              til å sende. Vi jobber på spreng med å komme tilbake.
            </p>
          </div>
        </Alert>
        {/*<VideoPlayer title="Frikanalen direkte" src="https://frikanalen.no/stream/index.m3u8" />*/}
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
