import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion, AccordionItem } from "@heroui/react";
import { format } from "date-fns";
import { useScheduleCursor } from "@/app/useScheduleCursor";
import { VideoBlurb } from "@/app/videoBlurb";

export const MetadataCurrentAndNext = ({
  schedule,
}: {
  schedule: ScheduleitemRead[];
}) => {
  const { currentProgram, nextProgram } = useScheduleCursor(schedule);

  return (
    <Accordion itemClasses={{ indicator: "text-primary-foreground" }}>
      <AccordionItem
        key={"1"}
        title={
          <div className={"flex"}>
            <div className={"basis-12 shrink-0"}>Nå:</div>
            {currentProgram?.video.name}
          </div>
        }
        subtitle={
          <h4 className={"text-medium pl-12 text-primary-700"}>
            av {currentProgram?.video.organization.name}
          </h4>
        }
      >
        <div className={"pl-12 pb-3"}>
          {currentProgram?.video && <VideoBlurb video={currentProgram.video} />}
        </div>
      </AccordionItem>
      <AccordionItem
        key={"2"}
        title={
          <div className={"flex"}>
            <div className={"basis-12 shrink-0"}>
              {nextProgram && format(new Date(nextProgram.starttime), "HH:mm")}
            </div>
            {nextProgram?.video.name}
          </div>
        }
        subtitle={
          <h4 className={"text-medium pl-12 text-primary-700"}>
            av {nextProgram?.video.organization.name}
          </h4>
        }
      >
        <div className={"pl-12"}>
          {nextProgram?.video && <VideoBlurb video={nextProgram.video} />}
        </div>
      </AccordionItem>
    </Accordion>
  );
};
