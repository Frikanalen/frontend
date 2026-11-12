"use client";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion } from "@heroui/react";
import { parseISO } from "date-fns";
import Link from "next/link";
import cx from "classnames";
import { VideoBlurb } from "@/app/videoBlurb";
import { phaseOf, useDatePhaseInHash } from "@/app/schedule/useDatePhaseInHash";
import { formatOsloTime } from "@/lib/osloTime";
import { useNow } from "@/app/frontpage/useNow";

/** A running time as a viewer would say it: "28 min", "1 t 30 min". */
const minutesBetween = (from: string, to: string) => {
  const minutes = Math.round((Date.parse(to) - Date.parse(from)) / 60_000);
  if (!(minutes > 0)) return null;
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} t${minutes % 60 ? ` ${minutes % 60} min` : ""}` : `${minutes} min`;
};

/**
 * One part of the day as a TV listing: the start time large and tabular on
 * the left, the programme and who made it beside it. The programme on air is
 * a dark band, the same "stage" the player sits on.
 */
export const ScheduleItemList = ({ items }: { items: ScheduleitemRead[] }) => {
  const [phase] = useDatePhaseInHash();
  const now = useNow(30_000);
  const filteredItems = items.filter((item) => phaseOf(parseISO(item.starttime)) == phase);

  if (filteredItems.length === 0)
    return (
      <p className="border-t-2 border-foreground py-6 text-default-600">
        Ingen programmer er satt opp i denne delen av døgnet.
      </p>
    );

  return (
    <Accordion className="border-t-2 border-foreground">
      {filteredItems.map(({ id, starttime, endtime, video, defaultName, isLive }) => {
        const startsAt = formatOsloTime(starttime);
        const name = video?.name || defaultName || "Uten programnavn";
        const onAir = Date.parse(starttime) <= now && now < Date.parse(endtime);
        const over = Date.parse(endtime) <= now && Date.parse(endtime) > Date.parse(starttime);
        const length = minutesBetween(starttime, endtime);
        return (
          <Accordion.Item
            key={id}
            id={String(id)}
            className={cx(onAir && "bg-stage text-stage-foreground")}
          >
            <Accordion.Heading>
              <Accordion.Trigger className="gap-4 px-2 py-4 text-base sm:gap-6 sm:px-3">
                <div
                  className={cx(
                    "w-16 shrink-0 text-xl font-bold sm:w-20 sm:text-2xl",
                    over && "font-semibold text-default-600",
                  )}
                >
                  {startsAt}
                </div>
                <div className="min-w-0 flex-1">
                  {onAir ? (
                    <div className="pb-1 text-xs font-bold tracking-[0.14em] text-brand-leaf uppercase">
                      Nå
                    </div>
                  ) : null}
                  <div
                    className={cx(
                      "text-lg leading-snug sm:text-xl",
                      over ? "font-semibold text-default-600" : "font-bold",
                    )}
                  >
                    {video ? (
                      <Link className="hover:underline" href={`/video/${video.id}`}>
                        {name}
                      </Link>
                    ) : (
                      <span>{name}</span>
                    )}
                  </div>
                  {video || isLive ? (
                    <div className={cx("text-sm", onAir ? "text-stage-muted" : "text-default-600")}>
                      {video ? (
                        <Link
                          className="hover:underline"
                          href={`/organization/${video.organization.id}`}
                        >
                          {video.organization.name}
                        </Link>
                      ) : null}
                      {video && isLive ? " · " : ""}
                      {isLive ? (
                        <span
                          className={cx(
                            "font-semibold",
                            onAir ? "text-brand-coral" : "text-danger-700",
                          )}
                        >
                          Direktesending
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {length ? (
                  <div
                    className={cx(
                      "hidden shrink-0 text-sm sm:block",
                      onAir ? "text-stage-muted" : "text-default-600",
                    )}
                  >
                    {length}
                  </div>
                ) : null}
                <Accordion.Indicator
                  className={cx("size-4", onAir ? "text-stage-muted" : "text-default-600")}
                />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                {video ? (
                  <div className="pb-4 pl-20 sm:pl-28">
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
