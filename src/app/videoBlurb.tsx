import { ScheduleitemVideo } from "@/generated/frikanalenDjangoAPI.schemas";
import Markdown from "markdown-to-jsx";
import Link from "next/link";

export const VideoBlurb = ({ video }: { video: ScheduleitemVideo }) => {
  const organization = video?.organization;
  return (
    <div className="prose dark:prose-invert">
      <h3 className="">
        Presentert av{" "}
        <Link href={`/organization/${organization.id}`}>
          {organization.name}
        </Link>
      </h3>
      <Markdown>
        {organization.description ||
          "*Organisasjonen har ikke oppgitt noen beskrivelse av seg selv.*"}
      </Markdown>
      <h4>{video.name}</h4>
      {video.description}
      <Markdown>{video.header || ""}</Markdown>
    </div>
  );
};
