"use client";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion, AccordionItem } from "@heroui/react";
import { format } from "date-fns";
import Link from "next/link";
import { VideoBlurb } from "@/app/videoBlurb";

export const ScheduleItemList = ({ items }: { items: ScheduleitemRead[] }) => (
  <Accordion>
    {items.map(({ id, starttime, video }) => (
      <AccordionItem
        key={id}
        title={
          <div className={"flex"}>
            <div className={"basis-12 shrink-0"}>
              {format(new Date(starttime), "HH:mm")}
            </div>
            {video.name}
          </div>
        }
        textValue={`${format(new Date(starttime), "HH:mm")}: ${video.name}`}
        subtitle={
          <h4 className={"pl-12"}>
            Presentert av{" "}
            <Link href={`/organization/${video.organization.id}`}>
              {video.organization.name}
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
