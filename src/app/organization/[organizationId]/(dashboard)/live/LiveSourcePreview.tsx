"use client";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Button } from "@heroui/react";
import cx from "classnames";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { format } from "date-fns";
import { AirtimeHandoff } from "./AirtimeHandoff";
import { SignalReport, useSignal } from "./SignalReport";
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

  const { signal, previous } = useSignal(source.id, { enabled: source.enabled !== false, open });

  // The receiver knows whether a signal is in without a preview running;
  // where it cannot say, the preview's own state is the next best thing.
  const { label, className } = signal
    ? signal.receiving
      ? PHASES.playing
      : {
          label: source.isPulled ? "Hentes ved behov" : "Ingen signal",
          className: "border-default-300 text-default-600",
        }
    : PHASES[phase];
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
          {signal || running ? (
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
          {signal ? (
            <section className="space-y-1">
              <h3 className="font-semibold">Signalet deres</h3>
              <SignalReport previous={previous} pulled={source.isPulled} signal={signal} />
            </section>
          ) : null}
          {phase === "playing" && (
            <section>
              <h3 className="font-semibold">Lydnivå</h3>
              <div className="mt-1">
                <VuMeter stream={stream} />
              </div>
            </section>
          )}
          <section>
            <h3 className="font-semibold">Kommende sendinger</h3>
            {source.upcomingTransmissions.length === 0 ? (
              <p className="text-sm text-default-600">Ingen ennå.</p>
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
        {/* Going on air again is what most come back for, so it sits above
            the setup. Only while open: it asks for the airtime. */}
        {organizationId != null && open && source.enabled ? (
          <div className="border-t border-default-200 pt-4 md:col-span-2">
            <AirtimeHandoff organizationId={organizationId} source={source} />
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
};
