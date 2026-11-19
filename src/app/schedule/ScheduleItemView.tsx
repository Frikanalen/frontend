"use client";
import { PublicGrant, ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { Accordion } from "@heroui/react";
import Link from "next/link";
import cx from "classnames";
import { VideoBlurb } from "@/app/videoBlurb";
import { formatOsloTime } from "@/lib/osloTime";
import { useNow } from "@/app/frontpage/useNow";

/** A running time as a viewer would say it: "28 min", "1 t 30 min". */
const minutesBetween = (from: string, to: string) => {
  const minutes = Math.round((Date.parse(to) - Date.parse(from)) / 60_000);
  if (!(minutes > 0)) return null;
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours} t${minutes % 60 ? ` ${minutes % 60} min` : ""}` : `${minutes} min`;
};

type Block = { grant: PublicGrant | null; items: ScheduleitemRead[]; start: number };

/** The day as blocks in air order: each grant with its programmes, and runs of programmes outside any grant. */
const blocksOf = (items: ScheduleitemRead[], grants: PublicGrant[]): Block[] => {
  const blocks: Block[] = grants.map((grant) => ({
    grant,
    items: [],
    start: Date.parse(grant.starttime),
  }));
  const byGrant = new Map(blocks.map((b) => [b.grant!.id, b]));
  const loose: ScheduleitemRead[] = [];
  for (const item of items) (byGrant.get(item.grant ?? -1)?.items ?? loose).push(item);
  for (const item of loose)
    blocks.push({ grant: null, items: [item], start: Date.parse(item.starttime) });
  blocks.sort((a, b) => a.start - b.start);
  // Neighbouring programmes outside any grant read as one block.
  return blocks.reduce<Block[]>((out, block) => {
    const last = out.at(-1);
    if (last && !last.grant && !block.grant) last.items.push(...block.items);
    else out.push(block);
    return out;
  }, []);
};

/**
 * A day's schedule as a TV listing, grouped by whose airtime it is. Each
 * organization's window is a heading with its programmes under it; what
 * Frikanalen itself puts between them is listed without one.
 */
export const ScheduleItemList = ({
  items,
  grants = [],
}: {
  items: ScheduleitemRead[];
  grants?: PublicGrant[];
}) => {
  const now = useNow(30_000);
  const sortedItems = items.toSorted((a, b) => Date.parse(a.starttime) - Date.parse(b.starttime));
  const blocks = blocksOf(sortedItems, grants);

  if (blocks.length === 0)
    return (
      <p className="border-t-2 border-foreground py-6 text-default-600">
        Ingen programmer er satt opp denne dagen.
      </p>
    );

  return (
    <div className="flex flex-col gap-8">
      {blocks.map(({ grant, items }) => {
        if (!grant)
          return (
            <section key={`loose-${items[0].id}`}>
              <h2 className="border-t-2 border-foreground px-2 pt-3 pb-1 text-xs font-bold tracking-[0.14em] text-default-600 uppercase sm:px-3">
                Fra Frikanalen
              </h2>
              <Rows items={items} now={now} />
            </section>
          );
        const over = Date.parse(grant.endtime) <= now;
        return (
          <section key={grant.id} aria-labelledby={`grant-${grant.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-foreground px-2 pt-3 pb-2 sm:px-3">
              <h2 id={`grant-${grant.id}`} className="min-w-0">
                <span className="block text-xs font-bold tracking-[0.14em] text-default-600 uppercase">
                  Sendetid
                </span>
                <Link
                  className={cx(
                    "text-xl leading-tight font-extrabold tracking-tight hover:underline sm:text-2xl",
                    over && "text-default-600",
                  )}
                  href={`/organization/${grant.organization.id}`}
                >
                  {grant.organization.name}
                </Link>
              </h2>
              <p className="shrink-0 text-sm text-default-600 tabular-nums">
                {formatOsloTime(grant.starttime)}–{formatOsloTime(grant.endtime)}
              </p>
            </div>
            {items.length ? (
              <Rows items={items} now={now} ownerId={grant.organization.id} />
            ) : (
              <p className="border-t border-default-200 px-2 py-4 text-default-600 sm:px-3">
                {over
                  ? "Sendetiden ble ikke brukt."
                  : `${grant.organization.name} har ikke satt opp programmer ennå.`}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
};

const Rows = ({
  items,
  now,
  ownerId,
  className = "border-t border-default-200",
}: {
  items: ScheduleitemRead[];
  now: number;
  ownerId?: number;
  className?: string;
}) => {
  return (
    <Accordion className={className}>
      {items.map(({ id, starttime, endtime, video, defaultName, isLive }) => {
        const startsAt = formatOsloTime(starttime);
        const name = video?.name || defaultName || "Uten programnavn";
        const onAir = Date.parse(starttime) <= now && now < Date.parse(endtime);
        const over = Date.parse(endtime) <= now && Date.parse(endtime) > Date.parse(starttime);
        const length = minutesBetween(starttime, endtime);
        // Inside an organization's own airtime its name is in the heading
        // already; a row only names the maker when it is someone else.
        const showOrg = video && video.organization.id !== ownerId;
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
                  {showOrg || isLive ? (
                    <div className={cx("text-sm", onAir ? "text-stage-muted" : "text-default-600")}>
                      {showOrg ? (
                        <Link
                          className="hover:underline"
                          href={`/organization/${video.organization.id}`}
                        >
                          {video.organization.name}
                        </Link>
                      ) : null}
                      {showOrg && isLive ? " · " : ""}
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
