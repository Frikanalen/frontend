"use client";
import { useEffect, useRef } from "react";
import { Button, Card, Chip } from "@heroui/react";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatBitrate } from "@/lib/live/streamStats";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { format } from "date-fns";
import { type PreviewPhase, useLivePreview } from "./useLivePreview";
import { VuMeter } from "./VuMeter";

const PHASES: Record<
  PreviewPhase,
  { label: string; color: "default" | "primary" | "success" | "warning" | "danger" }
> = {
  idle: { label: "Ikke startet", color: "default" },
  connecting: { label: "Kobler til …", color: "primary" },
  waiting: { label: "Venter på signal", color: "warning" },
  playing: { label: "Mottar signal", color: "success" },
  unauthorized: { label: "Ingen tilgang", color: "danger" },
  unsupported: { label: "Kan ikke spilles av", color: "danger" },
  error: { label: "Feil", color: "danger" },
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs text-default-500">{label}</dt>
    <dd className="font-mono">{value}</dd>
  </div>
);

export const LiveSourcePreview = ({
  source,
  autoStart,
}: {
  source: LiveSource;
  autoStart: boolean;
}) => {
  const { phase, variant, stream, stats, error, start, stop, running } = useLivePreview(source.id);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (autoStart) start();
  }, [autoStart, start]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const { label, color } = PHASES[phase];
  const video = stats?.video;
  // Packets arriving but carrying nothing: the encoder is connected yet
  // sending no picture, which is worth saying apart from "no signal".
  const videoStalled = phase === "playing" && video?.bitrate === 0;

  return (
    <Card>
      <Card.Header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{source.name}</h2>
          {!source.enabled && <p className="text-sm text-danger">Denne kilden er deaktivert.</p>}
        </div>
        <div className="flex items-center gap-2">
          <Chip color={color === "primary" ? "accent" : color} variant="soft" role="status">
            <Chip.Label>{label}</Chip.Label>
          </Chip>
          {running ? (
            <Button size="sm" variant="tertiary" onPress={stop}>
              Stopp
            </Button>
          ) : (
            <Button size="sm" onPress={start} isDisabled={!source.enabled} variant="primary">
              Start forhåndsvisning
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Content className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <video
            ref={videoRef}
            className="aspect-video w-full rounded-lg bg-black"
            autoPlay
            playsInline
            muted
            controls
          />
          {phase === "waiting" && (
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
            <h3 className="font-semibold">Video</h3>
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
              <p className="text-sm text-default-600">Ingen bookede sendinger.</p>
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
      </Card.Content>
    </Card>
  );
};
