"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import VideoPlayer from "@/components/stream/VideoPlayer";
import Markdown from "markdown-to-jsx";

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
  const videoUrl = files.webmMed ?? files.theora;
  console.log("videoUrl", videoUrl);
  return (
    <div className="space-y-4 bg-background text-foreground rounded-none">
      <div>
        <VideoPlayer
          title={name}
          src={videoUrl ?? ""}
          poster={files.largeThumb}
        />
        <div className="p-4">
          <h1 className={"font-bold text-2xl"}>{name}</h1>
          <h2 className={"text-lg"}>
            av <span className={"font-bold"}>{orgName}</span>
          </h2>
          <div className={"prose dark:prose-invert text-foreground py-2"}>
            <Markdown>
              {description ?? "*videoen har ingen beskrivelse*"}
            </Markdown>
          </div>
          <div className={"prose dark:prose-invert text-foreground"}>
            {orgDescription?.length && <Markdown>{orgDescription}</Markdown>}
          </div>
        </div>
      </div>
    </div>
  );
};
