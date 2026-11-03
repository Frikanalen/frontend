"use client";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion } from "@heroui/react";
import { parseISO } from "date-fns";
import Link from "next/link";
import { VideoBlurb } from "@/app/videoBlurb";
import { phaseOf, useDatePhaseInHash } from "@/app/schedule/useDatePhaseInHash";
import { formatOsloTime } from "@/lib/osloTime";
import { GoArrowUpRight } from "react-icons/go";

export const ScheduleItemList = ({ items }: { items: ScheduleitemRead[] }) => {
  const [phase] = useDatePhaseInHash();
  const filteredItems = items.filter((item) => phaseOf(parseISO(item.starttime)) == phase);

  return (
    <Accordion className="mt-2">
      {filteredItems.map(({ id, starttime, video, defaultName }) => {
        const startsAt = formatOsloTime(starttime);
        const name = video?.name || defaultName || "Uten programnavn";
        return (
          <Accordion.Item key={id} id={String(id)}>
            <Accordion.Heading>
              <Accordion.Trigger className="px-2 text-base">
                <div className="min-w-0 flex-1">
                  <div className="flex">
                    <div className="basis-12 shrink-0">{startsAt}</div>

                    {video ? (
                      <Link className="text-primary-700" href={`/video/${video.id}`}>
                        {name}
                        <GoArrowUpRight className="inline" />
                      </Link>
                    ) : (
                      <span>{name}</span>
                    )}
                  </div>
                  {video && (
                    <h4 className="pl-12 text-sm">
                      Presentert av{" "}
                      <Link
                        className="text-primary-700"
                        href={`/organization/${video.organization.id}`}
                      >
                        {video.organization.name}
                        <GoArrowUpRight className="inline" />
                      </Link>
                    </h4>
                  )}
                </div>
                <Accordion.Indicator className="size-3 text-foreground/30" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                {video ? (
                  <div className="pl-12 pb-3">
                    <VideoBlurb video={video} />
                  </div>
                ) : null}
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};
