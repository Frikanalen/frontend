"use client";
import { AXIOS_INSTANCE } from "@/api/mutator/customAxios";
import { useScheduleitemsList } from "@/generated/scheduleitems/scheduleitems";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import type Hls from "hls.js";
import cx from "classnames";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Coverage,
  coverageUrl,
  type EpgRow,
  epgRow,
  rowAt,
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

const KIND_LABEL: Record<EpgRow["kind"], string | undefined> = {
  video: undefined,
  live: "Direkte",
  poster: "Plakat",
  graphic: "Grafikk",
  other: undefined,
};

const hhmm = (instant: Date) => osloClockOf(instant).slice(0, 5);

/** What the schedule says was on at the moment playing: the line under the player. */
const NowAiring = ({ row, playingAt }: { row?: EpgRow; playingAt: Date | null }) => (
  <div className="min-h-14">
    <p className="text-lg font-semibold tabular-nums">
      {playingAt ? `Sendt ${osloDateOf(playingAt)} kl. ${osloClockOf(playingAt)}` : "\u00a0"}
    </p>
    {row ? (
      <p className="text-default-600">
        <span className="tabular-nums">
          {hhmm(row.start)}–{hhmm(row.end)}
        </span>{" "}
        <span className="font-semibold text-foreground">{row.title}</span>
        {row.organization ? ` · ${row.organization}` : ""}
        {KIND_LABEL[row.kind] ? ` · ${KIND_LABEL[row.kind]}` : ""}
      </p>
    ) : playingAt ? (
      <p className="text-default-600">Ingenting i sendeplanen akkurat nå.</p>
    ) : null}
  </div>
);

/** The day's schedule beside the player: the row on air is marked, a click plays from its start. */
const Programmes = ({
  rows,
  current,
  loading,
  onPick,
}: {
  rows: EpgRow[];
  current?: EpgRow;
  loading: boolean;
  onPick: (_instant: Date) => void;
}) => {
  const marked = useRef<HTMLLIElement>(null);
  useEffect(() => {
    marked.current?.scrollIntoView({ block: "nearest" });
  }, [current?.id]);

  if (loading) return <p className="text-default-600">Henter sendeplanen …</p>;
  if (rows.length === 0)
    return <p className="text-default-600">Ingen sendeplan for denne dagen.</p>;
  return (
    <ol
      aria-label="Sendeplan"
      className="max-h-[32rem] overflow-y-auto border-y border-default-200"
    >
      {rows.map((row) => {
        const active = row.id === current?.id;
        return (
          <li key={row.id} ref={active ? marked : undefined}>
            <button
              type="button"
              aria-current={active ? "true" : undefined}
              className={cx(
                "flex w-full gap-3 border-b border-l-4 border-default-200 border-l-transparent px-2 py-2 text-left hover:bg-default-100",
                active && "border-l-accent bg-accent/15",
              )}
              onClick={() => onPick(row.start)}
            >
              <span className="shrink-0 text-sm tabular-nums text-default-600">
                {hhmm(row.start)}
              </span>
              <span className="min-w-0">
                <span
                  className={cx(
                    "block truncate",
                    row.kind === "video" || row.kind === "live"
                      ? "font-semibold"
                      : "text-default-600",
                  )}
                >
                  {row.title}
                </span>
                <span className="block truncate text-sm text-default-600">
                  {[row.organization, KIND_LABEL[row.kind]].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
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

  const schedule = useScheduleitemsList(
    { date, include_fillers: true, surrounding: true, limit: 1000 },
    { query: { refetchInterval: today ? 60_000 : false } },
  );
  const rows = useMemo(
    () =>
      (schedule.data?.data.results ?? [])
        .map(epgRow)
        .filter((row) => row.end > day.start && row.start < day.end),
    [schedule.data, day],
  );
  const current = rowAt(rows, playingAt);

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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {src ? (
          <section className="space-y-2">
            <Player src={src} onClock={setPlayingAt} />
            <NowAiring row={current} playingAt={playingAt} />
          </section>
        ) : (
          <p className="text-default-600">
            Velg et tidspunkt, klikk i tidslinjen eller velg et program i sendeplanen. Grønt betyr
            at det finnes opptak.
          </p>
        )}
        <Programmes rows={rows} current={current} loading={schedule.isPending} onPick={play} />
      </div>
    </div>
  );
};
