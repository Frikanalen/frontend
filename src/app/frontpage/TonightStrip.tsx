"use client";
import Link from "next/link";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { useNow } from "@/app/frontpage/useNow";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";

const HOUR = 3_600_000;
/** How far ahead the strip looks, in hours. */
const SPAN = 6;

/**
 * The next six hours as one row, each programme as wide as it is long. It is
 * the schedule as a picture: at a glance, what is long, what is short and how
 * far off it is. Narrow screens scroll it sideways rather than squeeze it.
 */
export const TonightStrip = ({ schedule }: { schedule: ScheduleitemRead[] }) => {
  const now = useNow(60_000);
  const from = Math.floor(now / HOUR) * HOUR;
  const to = from + SPAN * HOUR;

  const blocks = schedule
    .map((item) => ({
      item,
      start: new Date(item.starttime).getTime(),
      end: new Date(item.endtime).getTime(),
    }))
    .filter(({ start, end }) => end > from && start < to && end > start)
    .sort((a, b) => a.start - b.start);

  if (blocks.length === 0) return null;

  // Gaps between programmes are drawn too, as empty space of the right width,
  // so everything after a gap still lines up with the hour marks above.
  const cells: { key: string; grow: number; block?: (typeof blocks)[number] }[] = [];
  let cursor = from;
  for (const block of blocks) {
    const start = Math.max(block.start, from);
    const end = Math.min(block.end, to);
    if (start > cursor) cells.push({ key: `gap-${cursor}`, grow: start - cursor });
    if (end > start) cells.push({ key: String(block.item.id), grow: end - start, block });
    cursor = Math.max(cursor, end);
  }
  if (cursor < to) cells.push({ key: `gap-${cursor}`, grow: to - cursor });

  return (
    <section aria-labelledby="tonight-heading" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-foreground pt-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" id="tonight-heading">
          De neste timene
        </h2>
        <p className="text-default-600 first-letter:uppercase" suppressHydrationWarning>
          {format(inOsloTime(new Date(now)), "EEEE d. MMMM", { locale: nb })}
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[60rem] flex-col gap-2">
          <div aria-hidden className="flex text-sm font-semibold text-default-600">
            {Array.from({ length: SPAN }, (_, hour) => (
              <div className="flex-1" key={hour} suppressHydrationWarning>
                {formatOsloTime(new Date(from + hour * HOUR))}
              </div>
            ))}
          </div>
          <ol className="flex h-28 gap-0.5">
            {cells.map(({ key, grow, block }) => {
              if (!block) return <li aria-hidden key={key} style={{ flex: `${grow} 1 0` }} />;
              const { item, start, end } = block;
              const onAir = start <= now && now < end;
              const name = item.video?.name || item.defaultName || "Uten programnavn";
              const label = (
                <>
                  <span
                    className={
                      onAir
                        ? "text-xs font-bold tracking-[0.12em] text-brand-leaf uppercase"
                        : item.isLive
                          ? "text-sm font-semibold text-danger-700"
                          : "text-sm text-default-600"
                    }
                  >
                    {onAir ? "Nå" : formatOsloTime(item.starttime)}
                    {item.isLive && !onAir ? " · Direkte" : ""}
                  </span>
                  <span className="line-clamp-2 leading-tight font-semibold break-words hyphens-auto">
                    {name}
                  </span>
                </>
              );
              const cell = `flex h-full min-w-0 flex-col justify-between overflow-hidden p-3 ${
                onAir ? "bg-stage text-stage-foreground" : "bg-background text-foreground"
              }`;
              return (
                <li className="min-w-0" key={key} style={{ flex: `${grow} 1 0` }}>
                  {item.video ? (
                    <Link className={`${cell} hover:underline`} href={`/video/${item.video.id}`}>
                      {label}
                    </Link>
                  ) : (
                    <div className={cell}>{label}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};
