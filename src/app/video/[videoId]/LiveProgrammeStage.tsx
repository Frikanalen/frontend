"use client";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import type { LiveAiring, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { formatOsloDateISO } from "@/lib/formatOsloDateISO";
import { useNow } from "@/app/frontpage/useNow";

/**
 * A live programme airs from its source until it has a file, so until then
 * there is nothing to play here. Whether a video is one is the API's to say:
 * it lists the coming live airings only for those.
 */
export const isAwaitingLiveAiring = (video: Video, hasPlayableFiles: boolean) =>
  !hasPlayableFiles && video.liveSource !== null;

/** "i dag", "i morgen" or "fredag 21. november", on Oslo's calendar. */
export const formatAiringDay = (instant: string, now: number) => {
  const day = formatOsloDateISO(new Date(instant));
  if (day === formatOsloDateISO(new Date(now))) return "i dag";
  if (day === formatOsloDateISO(new Date(now + 24 * 60 * 60 * 1000))) return "i morgen";
  return format(inOsloTime(instant), "EEEE d. MMMM", { locale: nb });
};

/** The airing on air at `now`, and the ones still to come. */
export const splitAirings = (airings: readonly LiveAiring[], now: number) => {
  const notOver = airings.filter((a) => Date.parse(a.endtime) > now);
  const onAir = notOver.find((a) => Date.parse(a.starttime) <= now);
  return { onAir, coming: notOver.filter((a) => a !== onAir) };
};

const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-xs font-bold tracking-[0.14em] uppercase ${className ?? ""}`}>
    {children}
  </div>
);

/**
 * Where the player would be, for a live programme that hasn't got a file:
 * when it goes out, or, while it is on air, the way to the live player.
 */
export const LiveProgrammeStage = ({ video }: { video: Video }) => {
  const now = useNow();
  const { onAir, coming } = splitAirings(video.liveAirings, now);
  const [next, ...later] = coming;
  const poster = video.files.largeThumb?.url;

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black text-stage-foreground">
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element -- a backdrop, sized by the stage
        <img
          src={poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
      )}
      <div className="relative flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        {onAir ? (
          <>
            <Eyebrow className="flex items-center gap-2 text-brand-coral">
              <span className="inline-block size-2.5 animate-pulse rounded-full bg-brand-coral" />
              Direkte nå
            </Eyebrow>
            <h2 className="text-2xl font-bold text-balance sm:text-3xl">{video.name}</h2>
            <p className="text-stage-muted">
              Sendes direkte til kl. {formatOsloTime(onAir.endtime)}
            </p>
            <Link
              href="/"
              className="mt-2 rounded-full bg-brand-coral px-5 py-2 font-semibold text-white hover:opacity-90"
            >
              Se direktesendingen
            </Link>
          </>
        ) : next ? (
          <>
            <Eyebrow className="text-brand-coral">Direktesending</Eyebrow>
            <h2 className="text-2xl font-bold text-balance sm:text-3xl">{video.name}</h2>
            <p className="text-lg">
              Sendes direkte {formatAiringDay(next.starttime, now)} kl.{" "}
              {formatOsloTime(next.starttime)}–{formatOsloTime(next.endtime)}
            </p>
            <p className="text-sm text-stage-muted">
              Når sendingen begynner, kan du se den{" "}
              <Link href="/" className="underline hover:text-stage-foreground">
                på forsiden
              </Link>
              .
            </p>
            {later.length > 0 && (
              <p className="text-sm text-stage-muted">
                Også{" "}
                {later
                  .slice(0, 3)
                  .map(
                    (a) =>
                      `${formatAiringDay(a.starttime, now)} kl. ${formatOsloTime(a.starttime)}`,
                  )
                  .join(", ")}
              </p>
            )}
          </>
        ) : (
          <>
            <Eyebrow className="text-brand-coral">Direktesending</Eyebrow>
            <h2 className="text-2xl font-bold text-balance sm:text-3xl">{video.name}</h2>
            <p className="text-stage-muted">Ingen kommende sendinger er satt opp.</p>
          </>
        )}
      </div>
    </div>
  );
};
