"use client";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion, AccordionItem } from "@heroui/react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { VideoBlurb } from "@/app/videoBlurb";
import { phaseOf, useDatePhaseInHash } from "@/app/schedule/useDatePhaseInHash";
import { GoArrowUpRight } from "react-icons/go";

export const ScheduleItemList = ({ items }: { items: ScheduleitemRead[] }) => {
  const [phase] = useDatePhaseInHash();
  const filteredItems = items.filter((item) => phaseOf(parseISO(item.starttime)) == phase);

  return (
    <Accordion>
      {filteredItems.map(({ id, starttime, video }) => (
        <AccordionItem
          key={id}
          title={
            <div className={"flex"}>
              <div className={"basis-12 shrink-0"}>{format(new Date(starttime), "HH:mm")}</div>

              <Link className={"text-primary-700"} href={`/video/${video.id}`}>
                {video.name}
                <GoArrowUpRight className={"inline"} />
              </Link>
            </div>
          }
          textValue={`${format(new Date(starttime), "HH:mm")}: ${video.name}`}
          subtitle={
            <h4 className={"pl-12"}>
              Presentert av{" "}
              <Link className={"text-primary-700"} href={`/organization/${video.organization.id}`}>
                {video.organization.name}
                <GoArrowUpRight className={"inline"} />
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
  );
};
