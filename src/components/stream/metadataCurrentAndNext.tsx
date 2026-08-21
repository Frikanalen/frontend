import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion, AccordionItem, Link } from "@heroui/react";
import { formatOsloTime } from "@/lib/osloTime";
import { useScheduleCursor } from "@/app/useScheduleCursor";
import { VideoBlurb } from "@/app/videoBlurb";
import { GoArrowUpRight } from "react-icons/go";

// One row of the now/next list: the label column ("Nå:" or a start time) on the
// left, the program it belongs to on the right.
type NowNextRow = {
  key: string;
  label: string;
  item: ScheduleitemRead;
};

export const MetadataCurrentAndNext = ({ schedule }: { schedule: ScheduleitemRead[] }) => {
  const { currentProgram, nextProgram } = useScheduleCursor(schedule);

  // Either slot can be empty on its own, so the rows are collected rather than
  // written out: an accordion item with nothing behind it renders as a bare
  // "av" and a link to /organization/undefined.
  const rows: NowNextRow[] = [
    ...(currentProgram ? [{ key: "current", label: "Nå:", item: currentProgram }] : []),
    ...(nextProgram
      ? [
          {
            key: "next",
            label: formatOsloTime(nextProgram.starttime),
            item: nextProgram,
          },
        ]
      : []),
  ];

  // Nothing to say at all: an empty schedule, or a backend that didn't answer.
  // The stream itself plays on regardless, so this stays a quiet aside.
  if (!rows.length)
    return (
      <p className={"px-2 py-4 text-foreground-500 italic"}>
        Vi har ingen programinformasjon akkurat nå.{" "}
        <Link className={"text-primary-700"} href={"/schedule"}>
          Se sendeplanen
          <GoArrowUpRight />
        </Link>
      </p>
    );

  return (
    <>
      {!currentProgram && (
        // On air, but in a gap in the schedule. Say so, rather than leaving the
        // "Nå" slot to be filled by whatever program happens to be nearby.
        <div className={"flex px-2 py-4 text-foreground-500 italic"}>
          <div className={"basis-12 shrink-0"}>Nå:</div>
          Ingen registrert sending.
        </div>
      )}
      <Accordion itemClasses={{ indicator: "text-primary-foreground" }}>
        {rows.map(({ key, label, item: { video } }) => (
          <AccordionItem
            key={key}
            textValue={`${label} ${video.name}`}
            title={
              <div className={"flex"}>
                <div className={"basis-12 shrink-0"}>{label}</div>
                {video.name}
              </div>
            }
            subtitle={
              <h4 className={"text-medium pl-12 text-primary-600"}>
                av{" "}
                <Link
                  className={"text-primary-700"}
                  href={`/organization/${video.organization.id}`}
                >
                  {video.organization.name}
                  <GoArrowUpRight />
                </Link>
              </h4>
            }
          >
            <div className={"pl-12 pb-3"}>
              <VideoBlurb video={video} />
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
};
