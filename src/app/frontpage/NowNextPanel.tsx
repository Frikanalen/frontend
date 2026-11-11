"use client";
import Link from "next/link";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatOsloTime } from "@/lib/osloTime";
import { useScheduleCursor } from "@/app/useScheduleCursor";
import { useNow } from "@/app/frontpage/useNow";

/** How many coming programmes are listed under the one on air. */
const UPCOMING = 4;

const nameOf = (item: ScheduleitemRead) =>
  item.video?.name || item.defaultName || "Uten programnavn";

const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-xs font-bold tracking-[0.14em] uppercase ${className ?? ""}`}>
    {children}
  </div>
);

/**
 * What is on now and what follows, beside the player on the stage. This is
 * the heading of the front page: a broadcaster's first answer is always
 * "what's on".
 */
export const NowNextPanel = ({ schedule }: { schedule: ScheduleitemRead[] }) => {
  const { currentProgram } = useScheduleCursor(schedule);
  const now = useNow();

  const upcoming = schedule
    .filter((item) => new Date(item.starttime).getTime() > now)
    .sort((a, b) => new Date(a.starttime).getTime() - new Date(b.starttime).getTime())
    .slice(0, UPCOMING);

  const started = currentProgram ? new Date(currentProgram.starttime).getTime() : 0;
  const ends = currentProgram ? new Date(currentProgram.endtime).getTime() : 0;
  const progress =
    currentProgram && ends > started
      ? Math.min(100, Math.max(0, ((now - started) / (ends - started)) * 100))
      : 0;

  return (
    <div className="flex min-w-0 flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        {currentProgram ? (
          <>
            <Eyebrow className="text-brand-leaf">
              Nå · {formatOsloTime(currentProgram.starttime)}–
              {formatOsloTime(currentProgram.endtime)}
            </Eyebrow>
            <h1 className="text-3xl leading-[1.08] font-bold tracking-tight text-balance sm:text-4xl">
              {/* A programme without a video behind it - a default name off
                  the weekly plan - has no page to go to, so it stays text. */}
              {currentProgram.video ? (
                <Link className="hover:underline" href={`/video/${currentProgram.video.id}`}>
                  {nameOf(currentProgram)}
                </Link>
              ) : (
                nameOf(currentProgram)
              )}
            </h1>
            {currentProgram.video ? (
              <Link
                className="self-start text-lg text-stage-muted hover:text-stage-foreground"
                href={`/organization/${currentProgram.video.organization.id}`}
              >
                {currentProgram.video.organization.name}
              </Link>
            ) : null}
            <div
              aria-label="Hvor langt programmet er kommet"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(progress)}
              className="mt-2 h-[3px] bg-stage-line"
              role="progressbar"
            >
              <div
                className="h-full bg-brand-leaf"
                style={{ width: `${progress}%` }}
                suppressHydrationWarning
              />
            </div>
          </>
        ) : (
          <>
            <Eyebrow className="text-brand-leaf">Nå</Eyebrow>
            <h1 className="text-2xl leading-tight font-bold text-stage-muted">
              Ingen registrert sending
            </h1>
          </>
        )}
      </div>

      {upcoming.length > 0 ? (
        <div className="flex flex-col">
          <Eyebrow className="pb-2.5 text-stage-muted">Senere</Eyebrow>
          <ol className="border-b border-stage-line">
            {upcoming.map((item) => (
              <li className="flex gap-4 border-t border-stage-line py-3" key={item.id}>
                <span className="w-12 shrink-0 font-semibold">
                  {formatOsloTime(item.starttime)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {item.video ? (
                      <Link className="hover:underline" href={`/video/${item.video.id}`}>
                        {nameOf(item)}
                      </Link>
                    ) : (
                      nameOf(item)
                    )}
                  </span>
                  {item.video || item.isLive ? (
                    <span className="block truncate text-sm text-stage-muted">
                      {item.video?.organization.name}
                      {item.video && item.isLive ? " · " : ""}
                      {item.isLive ? (
                        <span className="font-semibold text-brand-coral">Direkte</span>
                      ) : null}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Link
          className="self-start py-1 font-semibold text-brand-leaf hover:underline"
          href="/schedule"
        >
          Hele sendeplanen →
        </Link>
        <p className="text-sm text-stage-muted">
          Medlemmet er selv ansvarlig for innholdet i sine sendinger.
        </p>
      </div>
    </div>
  );
};
