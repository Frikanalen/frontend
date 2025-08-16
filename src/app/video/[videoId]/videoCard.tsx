"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import VideoPlayer from "@/components/stream/VideoPlayer";
import Markdown from "markdown-to-jsx";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { Link } from "@heroui/react";
import { notFound } from "next/navigation";
import { VideoMimeType, VideoSrc } from "@vidstack/react";

type DjangoFormatFsname = "webmMed" | "theora";

const djangoToMimeTable: Record<DjangoFormatFsname, VideoMimeType> = {
  webmMed: "video/webm",
  theora: "video/ogg",
} as const;

const djangoVideoFilesToVidstackSrcList = (videoFiles: { [key: string]: string }): VideoSrc[] =>
  (Object.entries(djangoToMimeTable) as [DjangoFormatFsname, VideoMimeType][]).map(
    ([fsname, mimetype]) => ({
      type: mimetype,
      src: videoFiles[fsname] ?? undefined,
    }),
  );

export const VideoCard = ({
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
  return (
    <div className="space-y-4 bg-background text-foreground rounded-xl">
      <div>
        <VideoPlayer
          title={name}
          src={djangoVideoFilesToVidstackSrcList(files)}
          poster={files.largeThumb}
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
