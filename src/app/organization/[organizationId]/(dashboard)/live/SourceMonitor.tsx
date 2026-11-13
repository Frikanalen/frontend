"use client";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { broadcastState, formatCountdown } from "@/lib/live/broadcast";
import { describeSignal } from "@/lib/live/signal";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import cx from "classnames";
import { format } from "date-fns";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { bookingDay } from "./BookingStatus";
import { useSignal } from "./SignalReport";
import { StreamVideo } from "./StreamVideo";
import { useLivePreview, type PreviewPhase } from "./useLivePreview";
import { useNow, useSource } from "./useSource";
import { VuMeter } from "./VuMeter";

// The last minutes before air, when the frame turns amber.
const SOON_MS = 5 * 60_000;

/** Keeps the screen from sleeping while the monitor is up, where it can. */
const useWakeLock = () => {
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock?.request("screen").then(
        (sentinel) => (lock = sentinel),
        () => undefined,
      );
    };
    acquire();
    // The browser drops the lock when the tab is hidden.
    document.addEventListener("visibilitychange", acquire);
    return () => {
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release();
    };
  }, []);
};

const WAITING: Partial<Record<PreviewPhase, string>> = {
  idle: "Kobler til …",
  connecting: "Kobler til …",
  waiting: "Ikke noe bilde",
  unauthorized: "Ingen tilgang. Last inn siden på nytt.",
  unsupported: "Nettleseren kan ikke vise bildet",
  error: "Kobler til på nytt …",
};

const Tile = ({
  title,
  phase,
  stream,
  children,
}: {
  title: string;
  phase: PreviewPhase;
  stream: MediaStream | null;
  children?: ReactNode;
}) => (
  <section aria-label={title} className="relative flex min-h-0 flex-col bg-black">
    <h2 className="absolute top-0 left-0 z-10 bg-black/70 px-3 py-1 text-xs font-bold tracking-widest uppercase sm:text-sm">
      {title}
    </h2>
    <StreamVideo
      className="aspect-video h-full min-h-0 w-full object-contain lg:aspect-auto"
      controls={false}
      label={title}
      stream={stream}
    />
    {phase === "playing" ? null : (
      <p className="absolute inset-0 flex items-center justify-center text-lg text-neutral-400">
        {WAITING[phase]}
      </p>
    )}
    {children}
  </section>
);

/**
 * A status display to leave up where a live broadcast is made, on a spare
 * screen or in a multiviewer: how long until air, whether the source is on
 * air, what Frikanalen receives and what it sends back out. Built to be
 * read from across a room, so it says little and says it large; the frame
 * turns amber in the last minutes and red on air.
 */
export const SourceMonitor = ({
  organizationId,
  source: initial,
}: {
  organizationId: number;
  source: LiveSource;
}) => {
  const source = useSource(organizationId, initial);
  const enabled = source.enabled !== false;
  const { signal, previous, clockOffset } = useSignal(source.id, { enabled, open: true });
  const now = useNow(clockOffset, 250);
  const own = useLivePreview(source.id);
  const program = useLivePreview(source.id, "program");
  const frame = useRef<HTMLDivElement>(null);
  useWakeLock();

  const { start: startOwn } = own;
  const { start: startProgram } = program;
  useEffect(() => {
    if (!enabled) return;
    startOwn();
    startProgram();
  }, [enabled, startOwn, startProgram]);

  const status = now
    ? broadcastState(source.upcomingTransmissions, now)
    : { state: "none" as const };
  const onAir = status.state === "onair";
  const soon = status.state === "upcoming" && status.until <= SOON_MS;
  // Only a claim where the receiver can be asked; else the picture speaks.
  const lost = signal ? !signal.receiving : false;
  const lines = signal?.receiving
    ? describeSignal(signal, source.isPulled, previous).filter(({ label }) =>
        ["Bilde", "Lyd", "Bitrate", "Pakketap"].includes(label),
      )
    : [];

  return (
    <div
      className={cx(
        "fixed inset-0 z-50 flex flex-col gap-3 overflow-auto border-[10px] bg-neutral-950 p-3 text-white sm:border-[16px] sm:p-4",
        onAir ? "border-red-600" : soon ? "border-amber-400" : "border-neutral-700",
      )}
      data-state={onAir ? "onair" : soon ? "soon" : status.state}
      ref={frame}
    >
      <header className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <h1 className="me-auto text-xl font-bold sm:text-2xl">{source.name}</h1>
        <time className="font-mono text-2xl tabular-nums sm:text-3xl" suppressHydrationWarning>
          {now ? format(inOsloTime(new Date(now)), "HH:mm:ss") : "--:--:--"}
        </time>
        <div className="flex gap-2 text-sm">
          <button
            className="border border-neutral-600 px-3 py-1 text-neutral-300 hover:bg-neutral-800"
            type="button"
            onClick={() =>
              document.fullscreenElement
                ? void document.exitFullscreen()
                : void frame.current?.requestFullscreen().catch(() => undefined)
            }
          >
            Fullskjerm
          </button>
          <Link
            className="border border-neutral-600 px-3 py-1 text-neutral-300 hover:bg-neutral-800"
            href={`/organization/${organizationId}/live/${source.id}`}
          >
            Lukk
          </Link>
        </div>
      </header>

      <div
        className={cx(
          "grid min-h-0 flex-1 gap-3",
          program.phase === "absent" ? "" : "lg:grid-cols-2",
        )}
      >
        <Tile phase={own.phase} stream={own.stream} title="Fra dere">
          {lost ? (
            <p className="absolute inset-x-0 bottom-0 bg-red-600 px-3 py-2 text-center text-xl font-bold tracking-wide uppercase">
              Ingen signal
            </p>
          ) : null}
        </Tile>
        {program.phase === "absent" ? null : (
          <Tile phase={program.phase} stream={program.stream} title="Frikanalen sender nå" />
        )}
      </div>

      <footer className="grid items-end gap-x-8 gap-y-3 lg:grid-cols-[1fr_auto]">
        <div role="timer">
          <p
            className={cx(
              "inline-block text-lg font-bold tracking-widest uppercase sm:text-2xl",
              onAir ? "bg-red-600 px-3 py-1" : soon ? "text-amber-400" : "text-neutral-300",
            )}
          >
            {onAir
              ? "På lufta"
              : status.state === "upcoming"
                ? "Direkte om"
                : "Ingen sending satt opp"}
          </p>
          {status.state === "none" ? null : (
            <p className="font-mono text-[clamp(3.5rem,15vw,11rem)] leading-none font-bold tabular-nums">
              {formatCountdown(onAir ? status.remaining : status.until)}
            </p>
          )}
          {status.state === "none" ? null : (
            <p className="text-base text-neutral-300 sm:text-xl">
              {onAir ? "igjen av " : ""}«{status.booking.name}» · {bookingDay(status.booking)} kl.{" "}
              {formatOsloTime(status.booking.starttime)}–{formatOsloTime(status.booking.endtime)}
            </p>
          )}
        </div>

        <div className="w-full space-y-3 lg:w-96">
          {lines.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {lines.map(({ label, value, status: mark }) => (
                <div key={label}>
                  <dt className="text-xs tracking-wide text-neutral-400 uppercase">{label}</dt>
                  <dd
                    className={cx(
                      "font-semibold",
                      mark === "bad" ? "text-red-400" : mark === "warn" ? "text-amber-400" : "",
                    )}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {own.phase === "playing" ? <VuMeter stream={own.stream} /> : null}
        </div>
      </footer>
    </div>
  );
};
