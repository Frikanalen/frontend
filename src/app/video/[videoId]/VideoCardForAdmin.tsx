"use client";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { notFound, useRouter } from "next/navigation";
import VideoPlayer from "@/components/stream/VideoPlayer";
import { Link } from "@heroui/react";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale/nb";
import Markdown from "markdown-to-jsx";
import { djangoVideoFilesToVidstackSrcList } from "@/app/video/[videoId]/videoCard";
import { useTimeoutFn } from "react-use";
import { revalidateVideoAction } from "@/components/stream/revalidateVideoAction";

export const VideoCardForAdmin = ({
  video: {
    id,
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
  const videoFiles = djangoVideoFilesToVidstackSrcList(files);
  const mediaPending = !videoFiles.length;
  const router = useRouter();

  useTimeoutFn(() => {
    if (mediaPending) {
      revalidateVideoAction(id.toString()).then(() => {
        router.refresh();
      });
    }
  }, 30000);

  if (!fkmember) return notFound();
  return (
    <div className="space-y-4 bg-background text-foreground rounded-xl">
      <div>
        <VideoPlayer
          title={name}
          src={videoFiles}
          poster={files.largeThumb}
          mediaPending={mediaPending}
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
