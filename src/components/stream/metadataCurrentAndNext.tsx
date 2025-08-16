import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion, AccordionItem, Link } from "@heroui/react";
import { format } from "date-fns";
import { useScheduleCursor } from "@/app/useScheduleCursor";
import { VideoBlurb } from "@/app/videoBlurb";
import { GoArrowUpRight } from "react-icons/go";

export const MetadataCurrentAndNext = ({ schedule }: { schedule: ScheduleitemRead[] }) => {
  const { currentProgram, nextProgram } = useScheduleCursor(schedule);
  const nextProgramStart = nextProgram && format(new Date(nextProgram.starttime), "HH:mm");

  return (
    <Accordion itemClasses={{ indicator: "text-primary-foreground" }}>
      <AccordionItem
        key={"1"}
        textValue={`Nå: ${currentProgram?.video.name}`}
        title={
          <div className={"flex"}>
            <div className={"basis-12 shrink-0"}>Nå:</div>
            {currentProgram?.video.name}
          </div>
        }
        subtitle={
          <h4 className={"text-medium pl-12 text-primary-600"}>
            av{" "}
            <Link
              className={"text-primary-700"}
              href={`/organization/${currentProgram?.video.organization.id}`}
            >
              {currentProgram?.video.organization.name}
              <GoArrowUpRight />
            </Link>
          </h4>
        }
      >
        <div className={"pl-12 pb-3"}>
          {currentProgram?.video && <VideoBlurb video={currentProgram.video} />}
        </div>
      </AccordionItem>
      <AccordionItem
        textValue={`${nextProgramStart}: ${nextProgram?.video.name}`}
        key={"2"}
        title={
          <div className={"flex"}>
            <div className={"basis-12 shrink-0"}>{nextProgramStart}</div>
            {nextProgram?.video.name}
          </div>
        }
        subtitle={
          <h4 className={"text-medium pl-12 text-primary-600"}>
            av{" "}
            <Link
              className={"text-primary-700"}
              href={`/organization/${nextProgram?.video.organization.id}`}
            >
              {nextProgram?.video.organization.name}
              <GoArrowUpRight />
            </Link>
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
