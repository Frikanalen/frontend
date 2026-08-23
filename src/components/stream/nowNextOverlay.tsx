"use client";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";
import { Link } from "@heroui/react";
import { formatOsloTime } from "@/lib/osloTime";
import { useScheduleCursor } from "@/app/useScheduleCursor";
import { GoArrowUpRight } from "react-icons/go";

// The overlay sits on top of the player's own click-to-play surface, so nothing
// in it may take pointer events except the links - anywhere else the viewer
// clicks should still start the stream.
const CLICKS_THROUGH = "pointer-events-none";
const CLICKABLE = "pointer-events-auto";

// A single line of the listing: a narrow label column ("NÅ", or a start time)
// and the programme it belongs to. Kept to one line each so the block stays a
// predictable height over the video no matter how long a programme name runs.
const Row = ({
  label,
  name,
  videoId,
  organization,
  dimmed,
}: {
  label: string;
  name: string;
  videoId?: number;
  organization?: { id: number; name: string };
  dimmed?: boolean;
}) => (
  <div className={"flex items-baseline gap-3"}>
    <div
      className={`shrink-0 basis-14 text-[0.65rem] font-semibold tracking-[0.2em] uppercase ${
        dimmed ? "text-white/60" : "text-primary-300"
      }`}
    >
      {label}
    </div>
    <div className={"min-w-0"}>
      <div
        className={`truncate ${
          dimmed ? "text-sm text-white/85" : "text-base font-semibold text-white sm:text-lg"
        }`}
      >
        {/* A programme without a video behind it - a default name off the weekly
            plan - has no page to go to, so it stays plain text. */}
        {videoId ? (
          <Link
            // Inherits the row's own colour and size rather than bringing
            // HeroUI's link styling into the middle of the listing.
            className={`text-[length:inherit] font-[inherit] text-inherit underline-offset-4 hover:underline ${CLICKABLE}`}
            href={`/video/${videoId}`}
          >
            {name}
          </Link>
        ) : (
          name
        )}
      </div>
      {organization && !dimmed && (
        <div className={"truncate text-xs text-white/75"}>
          av{" "}
          <Link
            className={`text-xs text-white/90 hover:text-white ${CLICKABLE}`}
            href={`/organization/${organization.id}`}
          >
            {organization.name}
            <GoArrowUpRight />
          </Link>
        </div>
      )}
    </div>
  </div>
);

// The now/next listing, drawn over the still player. The middle of the frame is
// left clear for the play button; everything here hugs the top and bottom edges.
export const NowNextOverlay = ({ schedule }: { schedule: ScheduleitemRead[] }) => {
  const { currentProgram, nextProgram } = useScheduleCursor(schedule);

  const nameOf = (item: ScheduleitemRead) =>
    item.video?.name || item.defaultName || "Uten programnavn";

  return (
    <div className={`absolute inset-0 z-50 flex flex-col justify-between ${CLICKS_THROUGH}`}>
      {/* Top strip: the live badge. The box behind it is one flat colour, so it
          needs no scrim of its own to sit on. */}
      <div className={"flex items-center gap-2 px-4 pt-3"}>
        <span className={"relative flex h-2 w-2"}>
          <span
            className={"absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70"}
          />
          <span className={"relative inline-flex h-2 w-2 rounded-full bg-red-500"} />
        </span>
        <span className={"text-[0.65rem] font-semibold tracking-[0.2em] text-white uppercase"}>
          Direkte
        </span>
      </div>

      {/* Bottom block: the listing itself, sitting straight on the flat backdrop. */}
      <div className={"flex flex-col gap-2 px-4 pt-6 pb-4"}>
        {currentProgram ? (
          <Row
            label={"Nå"}
            name={nameOf(currentProgram)}
            videoId={currentProgram.video?.id}
            organization={currentProgram.video?.organization}
          />
        ) : (
          <Row label={"Nå"} name={"Ingen registrert sending"} dimmed />
        )}

        {nextProgram && (
          <Row
            label={formatOsloTime(nextProgram.starttime)}
            name={nameOf(nextProgram)}
            videoId={nextProgram.video?.id}
            dimmed
          />
        )}

        <p className={"text-xs text-white/75"}>
          Medlemmet er selv ansvarlig for innholdet i sine sendinger.
        </p>
      </div>
    </div>
  );
};
