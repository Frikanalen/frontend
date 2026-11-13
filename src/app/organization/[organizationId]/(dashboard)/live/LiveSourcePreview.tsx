"use client";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Button } from "@heroui/react";
import cx from "classnames";
import Link from "next/link";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatBitrate } from "@/lib/live/streamStats";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { format } from "date-fns";
import { type PreviewPhase, useLivePreview } from "./useLivePreview";
import { VuMeter } from "./VuMeter";

const PHASES: Record<PreviewPhase, { label: string; className: string }> = {
  idle: { label: "Ikke startet", className: "border-default-300 text-default-600" },
  connecting: { label: "Kobler til …", className: "border-default-300 text-default-600" },
  waiting: { label: "Venter på signal", className: "border-warning text-warning-700" },
  playing: { label: "Mottar signal", className: "border-brand-green text-brand-green" },
  unauthorized: { label: "Ingen tilgang", className: "border-danger text-danger-700" },
  unsupported: { label: "Kan ikke spilles av", className: "border-danger text-danger-700" },
  error: { label: "Feil", className: "border-danger text-danger-700" },
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs text-default-500">{label}</dt>
    <dd className="font-mono">{value}</dd>
  </div>
);

/**
 * One live source: what it is and whether a signal arrives, and, opened, the
 * preview with its measurements and the source's setup.
 */
export const LiveSourcePreview = ({
  source,
  autoStart,
  startOpen = true,
  organizationId,
  children,
}: {
  source: LiveSource;
  autoStart: boolean;
  /** Closed, the source is one row; several sources start that way. */
  startOpen?: boolean;
  /** Links the coming broadcasts to the organization's airtime. */
  organizationId?: number;
  /** Setup for the source -- its encoder keys -- under the preview. */
  children?: ReactNode;
}) => {
  const { phase, variant, stream, stats, error, start, stop, running } = useLivePreview(source.id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(startOpen);
  const bodyId = useId();

  useEffect(() => {
    if (autoStart) start();
  }, [autoStart, start]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream, open]);

  const { label, className } = PHASES[phase];
  const video = stats?.video;
  // Packets arriving but carrying nothing: the encoder is connected yet
  // sending no picture, which is worth saying apart from "no signal".
  const videoStalled = phase === "playing" && video?.bitrate === 0;
  const next = source.upcomingTransmissions[0];

  return (
    <section aria-label={source.name} className="bg-background">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-5">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{source.name}</h2>
          <p className="text-sm break-words text-default-600">
            {source.isPulled
              ? `Frikanalen henter fra ${source.pullTarget}`
              : "Sendes til Frikanalen fra en koder"}
            {next
              ? ` · Neste sending ${format(inOsloTime(next.starttime), "dd.MM.")} ${formatOsloTime(next.starttime)}`
              : ""}
          </p>
          {!source.enabled && <p className="text-sm text-danger-700">Kilden er slått av.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {running ? (
            <span
              className={cx("border-l-4 px-2 py-1 text-sm font-semibold", className)}
              role="status"
            >
              {label}
            </span>
          ) : null}
          {running ? (
            <Button size="sm" variant="tertiary" onPress={stop}>
              Stopp
            </Button>
          ) : (
            <Button
              isDisabled={!source.enabled}
              size="sm"
              variant="primary"
              onPress={() => {
                setOpen(true);
                start();
              }}
            >
              Start forhåndsvisning
            </Button>
          )}
          <Button
            aria-controls={bodyId}
            aria-expanded={open}
            size="sm"
            variant="tertiary"
            onPress={() => setOpen(!open)}
          >
            {open ? "Skjul" : "Vis oppsett"}
          </Button>
        </div>
      </div>
      <div
        className={cx(
          "grid gap-4 border-t border-default-200 p-5 md:grid-cols-[2fr_1fr]",
          open ? "" : "hidden",
        )}
        id={bodyId}
      >
        <div className="space-y-2">
          <video
            ref={videoRef}
            className="aspect-video w-full rounded-lg bg-black"
            autoPlay
            playsInline
            muted
            controls
          />
          {phase === "waiting" && source.isPulled && (
            <p className="text-sm text-default-600">
              Frikanalen får ikke signal fra {source.pullTarget}. Sjekk at adressen stemmer og at
              det sendes derfra; siden prøver på nytt med noen sekunders mellomrom.
            </p>
          )}
          {phase === "waiting" && !source.isPulled && (
            <p className="text-sm text-default-600">
              Ingenting sendes til denne kilden ennå. Start sendingen fra koderen din; siden sjekker
              på nytt med noen sekunders mellomrom.
            </p>
          )}
          {phase === "unauthorized" && (
            <p className="text-sm text-danger">
              Du har ikke tilgang til å se denne kilden. Last inn siden på nytt og prøv igjen.
            </p>
          )}
          {phase === "unsupported" && (
            <p className="text-sm text-danger">
              Nettleseren din kan ikke spille av videoen (H.264). Bruk Chrome, eller slå på
              OpenH264-tillegget i Firefox under Tillegg → Programtillegg.
            </p>
          )}
          {phase === "error" && (
            <p className="text-sm text-danger">
              Kunne ikke koble til ({error}). Prøver igjen straks.
            </p>
          )}
          {videoStalled && <p className="text-sm text-warning-600">Ingen video mottas.</p>}
          {phase === "playing" && variant === "contribution" && (
            <p className="text-sm text-warning-600">
              Lydforhåndsvisningen er ikke tilgjengelig, så du ser bare bildet fra originalsignalet.
            </p>
          )}
          {variant === "preview" && (
            <p className="text-xs text-default-500">
              Videoen starter uten lyd. Slå på lyden i spilleren for å høre den; lydmåleren virker
              uansett.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <section>
            <h3 className="font-semibold">Forhåndsvisningen</h3>
            <p className="text-xs text-default-500">
              Målt på kopien som vises her, ikke på signalet slik koderen sender det.
            </p>
            <dl className="mt-1 grid grid-cols-2 gap-2">
              <Stat label="Bitrate" value={formatBitrate(video?.bitrate ?? null)} />
              <Stat label="Kodek" value={video?.codec ?? "–"} />
              <Stat
                label="Oppløsning"
                value={video?.width && video.height ? `${video.width}×${video.height}` : "–"}
              />
              <Stat
                label="Bilder/s"
                value={video?.framesPerSecond != null ? String(video.framesPerSecond) : "–"}
              />
              <Stat label="Tapte pakker" value={video ? String(video.packetsLost) : "–"} />
            </dl>
          </section>
          {phase === "playing" && (
            <section>
              <h3 className="font-semibold">Lyd</h3>
              <div className="mt-1">
                <VuMeter stream={stream} />
              </div>
            </section>
          )}
          <section>
            <h3 className="font-semibold">Kommende sendinger</h3>
            {source.upcomingTransmissions.length === 0 ? (
              <p className="text-sm text-default-600">
                Ingen ennå.
                {organizationId != null ? (
                  <>
                    {" "}
                    <Link
                      className="font-semibold text-link hover:underline"
                      href={`/organization/${organizationId}/schedule`}
                    >
                      Sett opp i sendetiden →
                    </Link>
                  </>
                ) : null}
              </p>
            ) : (
              <ul className="text-sm">
                {source.upcomingTransmissions.map((item) => (
                  <li key={item.id}>
                    {format(inOsloTime(item.starttime), "dd.MM.yyyy")}{" "}
                    {formatOsloTime(item.starttime)}–{formatOsloTime(item.endtime)} {item.name}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        {children}
      </div>
    </section>
  );
};
