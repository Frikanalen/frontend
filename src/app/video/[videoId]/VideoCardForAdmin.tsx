"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { notFound } from "next/navigation";
import VideoPlayer from "@/components/stream/VideoPlayer";
import { Link } from "@heroui/react";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale/nb";
import Markdown from "markdown-to-jsx";
import { djangoVideoFilesToVidstackSrcList } from "@/app/video/[videoId]/videoCard";

export const VideoCardForAdmin = ({
  video: {
    description,
    header,
    files,
    name,
    createdTime,
    organization: { description: orgDescription, name: orgName, id: orgId, fkmember },
  },
}: {
  video: Video;
}) => {
  if (!fkmember) return notFound();
  const videoFiles = djangoVideoFilesToVidstackSrcList(files);
  return (
    <div className="space-y-4 bg-background text-foreground rounded-xl">
      <div>
        <VideoPlayer
          title={name}
          src={videoFiles}
          poster={files.largeThumb}
          mediaPending={!!videoFiles.length}
        />

        <div className="p-4">
          <h1 className={"font-bold text-2xl"}>{name}</h1>
          <h2 className={"text-lg"}>
            av{" "}
            <Link href={`/organization/${orgId}`} className={"font-bold"}>
              {orgName}
            </Link>
          </h2>
          {!!createdTime && (
            <p>Lastet opp {format(parseISO(createdTime), "PPPPp", { locale: nb })}</p>
          )}
          <div className={"prose dark:prose-invert text-foreground py-2"}>
            <Markdown>{description ?? header ?? "*videoen har ingen beskrivelse*"}</Markdown>
          </div>
          <div className={"prose dark:prose-invert text-foreground"}>
            {!!orgDescription?.length && <Markdown>{orgDescription}</Markdown>}
          </div>
        </div>
      </div>
    </div>
  );
};
