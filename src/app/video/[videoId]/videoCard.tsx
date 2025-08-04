"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import VideoPlayer from "@/components/stream/VideoPlayer";
import Markdown from "markdown-to-jsx";
import { Card, CardBody, CardHeader } from "@heroui/react";

export const VideoCard = ({
  video: {
    description,
    files,
    name,
    organization: { description: orgDescription, name: orgName },
  },
}: {
  video: Video;
}) => {
  return (
    <div className="space-y-4">
      <h1 className={"font-bold text-2xl pb-4"}>{name}</h1>
      {files.theora && (
        <VideoPlayer
          title={name}
          src={files.theora}
          poster={files.largeThumb}
        />
      )}
      <Card>
        <CardHeader>
          <div>
            <h3 className={"text-lg font-bold"}>{orgName}</h3>

            <Markdown>
              {orgDescription?.length
                ? orgDescription
                : "*organisasjonen har ingen beskrivelse*"}
            </Markdown>
          </div>
        </CardHeader>
        <CardBody>
          <div className={"prose dark:prose-invert"}>
            <h4>Om videoen</h4>
            <Markdown>
              {description ?? "*videoen har ingen beskrivelse*"}
            </Markdown>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
