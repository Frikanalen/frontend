import Link from "next/link";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale/nb";

import Markdown from "markdown-to-jsx";
import { Fragment } from "react";

export const VideoCardMeta = ({ video }: { video: Video }) => {
  return (
    <div className="px-4 pt-2 pb-4">
      <h1 className={"font-bold text-2xl pt-0 pb-2"}>{video.name}</h1>
      <div className={"flex max-lg:flex-col gap-4"}>
        <div className={"basis-1/4 shrink-0"}>
          {!!video.createdTime && (
            <div>Postet {format(parseISO(video.createdTime), "PPPp", { locale: nb })}</div>
          )}
          <h2 className={"text-lg"}>
            av{" "}
            <Link href={`/organization/${video.organization.id}`} className={"font-bold"}>
              {video.organization.name}
            </Link>
          </h2>
          {video.series && (
            <p>
              Serie:{" "}
              <Link href={`/series/${video.series.id}`} className="font-semibold">
                {video.series.name}
              </Link>
              {video.episodeNumber ? ` · episode ${video.episodeNumber}` : ""}
            </p>
          )}

          <div className={"prose dark:prose-invert text-foreground"}>
            {!!video.organization.description?.length && (
              <div className="leading-6 text-primary-700">
                <Markdown>{video.organization.description}</Markdown>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className={"prose dark:prose-invert first-child:mt-0!"}>
            <Markdown options={{ wrapper: Fragment }}>
              {video.description ?? "*videoen har ingen beskrivelse*"}
            </Markdown>
          </div>
        </div>
      </div>
    </div>
  );
};
