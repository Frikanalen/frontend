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
import { SignalHistory, useSignalHistory } from "./SignalHistory";
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
    <h2 className="absolute top-0 left-0 z-10 bg-black/70 px-[0.8em] py-[0.25em] text-[0.8em] font-bold tracking-widest uppercase">
      {title}
    </h2>
    <StreamVideo
      className="aspect-video h-full min-h-0 w-full object-contain landscape:aspect-auto"
      controls={false}
      label={title}
      stream={stream}
    />
    {phase === "playing" ? null : (
      <p className="absolute inset-0 flex items-center justify-center text-[1.2em] text-neutral-400">
        {WAITING[phase]}
      </p>
    )}
    {children}
  </section>
);

// Everything on the monitor is sized in em from this, so it keeps its
// proportions from a wall screen down to a small window in a multiviewer:
// by height where the window is wide, by width where it is tall.
const SCALE = "max(6px, min(2.8vw, 1.85vh))";

/**
 * Digits as large as their number allows, a countdown in days being
 * longer: by the height there is in a wide window, by the column's width
 * otherwise.
 */
const digitSize = (text: string) =>
  text.length <= 5
    ? "min(14em, 30cqw)"
    : text.length <= 8
      ? "min(9.5em, 19cqw)"
      : "min(6em, 12cqw)";

/**
 * A status display to leave up where a live broadcast is made, on a spare
 * screen or in a multiviewer: how long until air, whether the source is on
 * air, what Frikanalen receives and what it sends back out. Two columns:
 * the crew's own signal with its figures on the left, the programme with
 * the schedule on the right. Built to be
 * read from across a room, so it says little and says it large; the frame
 * turns amber in the last minutes and red on air. The buttons stay out of
 * the picture until the pointer is over it.
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
  const {
    signal,
    previous,
    clockOffset,
    history: live,
  } = useSignal(source.id, { enabled, open: true });
  const history = useSignalHistory(source.id, live, { enabled });
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
  const lines = signal?.receiving ? describeSignal(signal, source.isPulled, previous) : [];
  const countdown =
    status.state === "none" ? null : formatCountdown(onAir ? status.remaining : status.until);

  return (
    <div
      className={cx(
        "group fixed inset-0 z-50 flex flex-col gap-[0.6em] overflow-auto border-[0.8em] bg-neutral-950 p-[0.6em] text-white",
        onAir ? "border-red-600" : soon ? "border-amber-400" : "border-neutral-700",
      )}
      data-state={onAir ? "onair" : soon ? "soon" : status.state}
      ref={frame}
      style={{ fontSize: SCALE }}
    >
      <header className="flex items-baseline gap-x-[1.5em]">
        <h1 className="me-auto truncate text-[1.4em] font-bold">{source.name}</h1>
        <time className="font-mono text-[1.6em] tabular-nums" suppressHydrationWarning>
          {now ? format(inOsloTime(new Date(now)), "HH:mm:ss") : "--:--:--"}
        </time>
      </header>
      <div className="absolute top-[0.4em] left-1/2 z-20 flex -translate-x-1/2 gap-2 text-sm opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:order-last [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100">
        <button
          className="border border-neutral-600 bg-neutral-950 px-3 py-1 text-neutral-300 hover:bg-neutral-800"
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
          className="border border-neutral-600 bg-neutral-950 px-3 py-1 text-neutral-300 hover:bg-neutral-800"
          href={`/organization/${organizationId}/live/${source.id}`}
        >
          Lukk
        </Link>
      </div>

      {/* Filled column by column where the window is wide: each picture
          with what belongs to it underneath, the pictures the same size. */}
      <div className="grid min-h-0 flex-1 gap-[0.6em] landscape:grid-flow-col landscape:grid-cols-2 landscape:grid-rows-[minmax(0,1fr)_auto]">
        <Tile phase={own.phase} stream={own.stream} title="Fra dere">
          {lost ? (
            <p className="absolute inset-x-0 bottom-0 bg-red-600 px-[0.6em] py-[0.3em] text-center text-[1.4em] font-bold tracking-wide uppercase">
              Ingen signal
            </p>
          ) : null}
        </Tile>

        <section aria-label="Signalet deres" className="min-w-0 space-y-[0.7em]">
          {lines.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-[1.2em] gap-y-[0.5em] leading-tight sm:grid-cols-3">
              {lines.map(({ label, value, status: mark }) => (
                <div className="min-w-0 border-t border-neutral-700 pt-[0.3em]" key={label}>
                  <dt className="text-[0.75em] tracking-widest text-neutral-400 uppercase">
                    {label}
                  </dt>
                  <dd
                    className={cx(
                      "truncate text-[1.3em] font-semibold",
                      mark === "bad" ? "text-red-400" : mark === "warn" ? "text-amber-400" : "",
                    )}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <SignalHistory history={history} />
          {own.phase === "playing" ? <VuMeter compact stream={own.stream} /> : null}
        </section>

        {program.phase === "absent" ? null : (
          <Tile phase={program.phase} stream={program.stream} title="Frikanalen sender nå" />
        )}

        <div
          className={cx(
            "@container min-w-0",
            program.phase === "absent" ? "self-center landscape:row-span-2" : "",
          )}
          role="timer"
        >
          <p
            className={cx(
              "inline-block text-[1.4em] leading-tight font-bold tracking-widest uppercase",
              onAir ? "bg-red-600 px-[0.5em]" : soon ? "text-amber-400" : "text-neutral-300",
            )}
          >
            {onAir
              ? "På lufta"
              : status.state === "upcoming"
                ? "Direkte om"
                : "Ingen sending satt opp"}
          </p>
          {countdown === null ? null : (
            <p
              className="font-mono leading-none font-bold whitespace-nowrap tabular-nums"
              style={{ fontSize: digitSize(countdown) }}
            >
              {countdown}
            </p>
          )}
          {status.state === "none" ? null : (
            <p className="text-[1.2em] leading-snug text-neutral-300">
              {onAir ? "igjen av " : ""}«{status.booking.name}»
              <br />
              {bookingDay(status.booking)} kl. {formatOsloTime(status.booking.starttime)}–
              {formatOsloTime(status.booking.endtime)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
