"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import VideoPlayer from "@/components/stream/VideoPlayer";
import Markdown from "markdown-to-jsx";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { Link } from "@heroui/react";
import { notFound } from "next/navigation";

export const VideoCard = ({
  video: {
    description,
    files,
    name,
    createdTime,
    organization: {
      description: orgDescription,
      name: orgName,
      id: orgId,
      fkmember,
    },
  },
}: {
  video: Video;
}) => {
  if (!fkmember) return notFound();
  const videoUrl = files.webmMed ?? files.theora ?? "";
  return (
    <div className="space-y-4 bg-background text-foreground rounded-xl">
      <div>
        <VideoPlayer title={name} src={videoUrl} poster={files.largeThumb} />
        <div className="p-4">
          <h1 className={"font-bold text-2xl"}>{name}</h1>
          <h2 className={"text-lg"}>
            av{" "}
            <Link href={`/organization/${orgId}`} className={"font-bold"}>
              {orgName}
            </Link>
          </h2>
          {!!createdTime && (
            <p>
              Lastet opp{" "}
              {format(parseISO(createdTime), "PPPPp", { locale: nb })}
            </p>
          )}
          <div className={"prose dark:prose-invert text-foreground py-2"}>
            <Markdown>
              {description ?? "*videoen har ingen beskrivelse*"}
            </Markdown>
          </div>
          <div className={"prose dark:prose-invert text-foreground"}>
            {!!orgDescription?.length && <Markdown>{orgDescription}</Markdown>}
          </div>
        </div>
      </div>
    </div>
  );
};
