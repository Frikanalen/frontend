import { Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { Link } from "@heroui/react";
import Markdown from "markdown-to-jsx";
import { Fragment } from "react";

export const VideoCardMeta = ({ video }: { video: Video }) => {
  return (
    <div className="p-4">
      <h1 className={"font-bold text-2xl py-2"}>{video.name}</h1>
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

          <div className={"prose dark:prose-invert text-foreground"}>
            {!!video.organization.description?.length && (
              <div className="leading-6 text-primary-700">
                <Markdown>{video.organization.description}</Markdown>
              </div>
            )}
          </div>
        </div>
        <div>
          {video.header?.length && <h4>{video.header}</h4>}
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