"use client";
import { AXIOS_INSTANCE } from "@/api/mutator/customAxios";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import type Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Coverage,
  coverageUrl,
  instantAt,
  osloClockOf,
  osloDateOf,
  osloDay,
  osloInstant,
  playlistUrl,
  spanPosition,
} from "./airlog";

const field = "rounded-lg border border-default-300 bg-background px-3 py-2";
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];
// How far behind live "Siste minutter" starts.
const RECENT_MINUTES = 3;

/** A day's timeline: green where the air log has a recording. Click to play from there. */
const Timeline = ({
  day,
  coverage,
  playingAt,
  onPick,
}: {
  day: { start: Date; end: Date };
  coverage?: Coverage;
  playingAt: Date | null;
  onPick: (_instant: Date) => void;
}) => {
  const length = day.end.getTime() - day.start.getTime();
  const cursor =
    playingAt && playingAt >= day.start && playingAt < day.end
      ? ((playingAt.getTime() - day.start.getTime()) / length) * 100
      : null;
  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-label="Velg tidspunkt i døgnet"
        className="relative block h-10 w-full cursor-pointer overflow-hidden rounded-md bg-default-200"
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          onPick(instantAt((event.clientX - box.left) / box.width, day));
        }}
      >
        {coverage?.spans.map((span) => {
          const { left, width } = spanPosition(span, day);
          return (
            <span
              key={span.start}
              className="absolute inset-y-0 bg-success"
              style={{ left: `${left}%`, width: `max(${width}%, 1px)` }}
              title={`${osloClockOf(new Date(span.start))}–${osloClockOf(new Date(span.end))}`}
            />
          );
        })}
        {cursor !== null ? (
          <span
            aria-hidden
            className="absolute inset-y-0 w-0.5 bg-foreground"
            style={{ left: `${cursor}%` }}
          />
        ) : null}
      </button>
      <div className="relative h-4 text-xs text-default-600">
        {HOURS.map((hour) => (
          <span
            key={hour}
            className="absolute -translate-x-1/2"
            style={{ left: `${(hour / 24) * 100}%` }}
          >
            {String(hour).padStart(2, "0")}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Plays an air log playlist with hls.js (natively where that is all there is). */
const Player = ({ src, onClock }: { src: string; onClock: (_instant: Date | null) => void }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let hls: Hls | undefined;
    let cancelled = false;
    setError(undefined);
    const tick = () => onClock(hls?.playingDate ?? null);
    element.addEventListener("timeupdate", tick);

    void import("hls.js").then(({ default: HlsJs }) => {
      if (cancelled) return;
      if (HlsJs.isSupported()) {
        // From the start of the playlist, not its live edge: it begins at the
        // moment asked for and only grows while that is recent.
        hls = new HlsJs({ startPosition: 0, liveDurationInfinity: true });
        hls.on(HlsJs.Events.ERROR, (_event, data) => {
          if (data.fatal) setError("Opptaket kunne ikke spilles av.");
        });
        hls.loadSource(src);
        hls.attachMedia(element);
      } else if (element.canPlayType("application/vnd.apple.mpegurl")) {
        element.src = src;
      } else {
        setError("Nettleseren kan ikke spille av opptaket.");
        return;
      }
      void element.play().catch(() => {});
    });

    return () => {
      cancelled = true;
      element.removeEventListener("timeupdate", tick);
      hls?.destroy();
      element.removeAttribute("src");
      element.load();
    };
  }, [src, onClock]);

  return (
    <div className="space-y-2">
      <video ref={video} controls playsInline className="aspect-video w-full bg-black" />
      {error ? <p className="text-danger">{error}</p> : null}
    </div>
  );
};

/** Staff look back at what went out on the stream, a week back and up to the last minute. */
export const AirLog = () => {
  const [date, setDate] = useState(() => osloDateOf(new Date()));
  const [time, setTime] = useState(() =>
    osloClockOf(new Date(Date.now() - 10 * 60_000)).slice(0, 5),
  );
  const [src, setSrc] = useState<string>();
  const [playingAt, setPlayingAt] = useState<Date | null>(null);
  const day = useMemo(() => osloDay(date), [date]);
  const today = date === osloDateOf(new Date());

  const coverage = useQuery({
    queryKey: ["/api/airlog/coverage", day.start, day.end],
    queryFn: async () => (await AXIOS_INSTANCE.get<Coverage>(coverageUrl(day.start, day.end))).data,
    // Today's grows by a segment every few seconds.
    refetchInterval: today ? 30_000 : false,
  });

  const play = (from: Date) => {
    setDate(osloDateOf(from));
    setTime(osloClockOf(from).slice(0, 5));
    setSrc(playlistUrl(from));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Dato
          <input
            className={field}
            type="date"
            value={date}
            onChange={(event) => event.target.value && setDate(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Klokkeslett
          <input
            className={field}
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </label>
        <Button isDisabled={!time} onPress={() => play(osloInstant(date, time))}>
          Spill av herfra
        </Button>
        <Button
          variant="secondary"
          onPress={() => play(new Date(Date.now() - RECENT_MINUTES * 60_000))}
        >
          Siste minutter
        </Button>
      </div>

      <Timeline day={day} coverage={coverage.data} playingAt={playingAt} onPick={play} />
      {coverage.isError ? (
        <p className="text-danger">{formatApiError(coverage.error)}</p>
      ) : coverage.data && coverage.data.spans.length === 0 ? (
        <p className="text-default-600">Sendeloggen har ingenting fra denne dagen.</p>
      ) : null}

      {src ? (
        <section className="space-y-2">
          <Player src={src} onClock={setPlayingAt} />
          <p className="text-lg font-semibold tabular-nums">
            {playingAt ? `Sendt ${osloDateOf(playingAt)} kl. ${osloClockOf(playingAt)}` : " "}
          </p>
        </section>
      ) : (
        <p className="text-default-600">
          Velg et tidspunkt, eller klikk i tidslinjen. Grønt betyr at det finnes opptak.
        </p>
      )}
    </div>
  );
};
