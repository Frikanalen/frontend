import { ScheduleitemVideo } from "@/generated/frikanalenDjangoAPI.schemas";
import Markdown from "markdown-to-jsx";
import { Fragment } from "react";

export const VideoBlurb = ({ video }: { video: ScheduleitemVideo }) => {
  const organization = video.organization;
  return (
    <div className="flex gap-4">
      <div className="basis-1/4 justify-start text-sm leading-6">
        {organization && <Markdown>{organization.description || ""}</Markdown>}
      </div>
      <div className="prose dark:prose-invert [&>*]:leading-6">
        <Markdown options={{ wrapper: Fragment }}>
          {video.header || ""}
        </Markdown>
      </div>
    </div>
  );
};
