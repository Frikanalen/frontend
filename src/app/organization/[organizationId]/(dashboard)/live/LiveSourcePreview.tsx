"use client";
import { useEffect, useRef } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Progress } from "@heroui/react";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatBitrate } from "@/lib/live/streamStats";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { format } from "date-fns";
import { type PreviewPhase, useLivePreview } from "./useLivePreview";

const PHASES: Record<
  PreviewPhase,
  { label: string; color: "default" | "primary" | "success" | "warning" | "danger" }
> = {
  idle: { label: "Ikke startet", color: "default" },
  connecting: { label: "Kobler til …", color: "primary" },
  waiting: { label: "Venter på signal", color: "warning" },
  playing: { label: "Mottar signal", color: "success" },
  unauthorized: { label: "Ingen tilgang", color: "danger" },
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
  const audio = stats?.audio;
  // Packets arriving but carrying nothing: the encoder is connected yet
  // sending no picture, which is worth saying apart from "no signal".
  const videoStalled = phase === "playing" && video?.bitrate === 0;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{source.name}</h2>
          {!source.enabled && <p className="text-sm text-danger">Denne kilden er deaktivert.</p>}
        </div>
        <div className="flex items-center gap-2">
          <Chip color={color} variant="flat" role="status">
            {label}
          </Chip>
          {running ? (
            <Button size="sm" variant="flat" onPress={stop}>
              Stopp
            </Button>
          ) : (
            <Button size="sm" color="primary" onPress={start} isDisabled={!source.enabled}>
              Start forhåndsvisning
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody className="grid gap-4 md:grid-cols-[2fr_1fr]">
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
          {phase === "error" && (
            <p className="text-sm text-danger">
              Kunne ikke koble til ({error}). Prøver igjen straks.
            </p>
          )}
          {phase === "playing" && variant === "contribution" && !audio && (
            <p className="text-sm text-warning-600">
              Viser originalsignalet uten lyd: nettleseren kan ikke spille av AAC-lyden, og
              lydforhåndsvisningen kjører ikke for denne kilden.
            </p>
          )}
          {videoStalled && <p className="text-sm text-warning-600">Ingen video mottas.</p>}
          <p className="text-xs text-default-500">
            Videoen starter uten lyd. Slå på lyden i spilleren for å høre den.
          </p>
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
          <section>
            <h3 className="font-semibold">Lyd</h3>
            <dl className="mt-1 grid grid-cols-2 gap-2">
              <Stat label="Bitrate" value={formatBitrate(audio?.bitrate ?? null)} />
              <Stat label="Kodek" value={audio?.codec ?? "–"} />
            </dl>
            {audio?.level != null && (
              <Progress
                className="mt-2"
                aria-label="Lydnivå"
                size="sm"
                value={Math.round(audio.level * 100)}
                color={audio.level > 0.9 ? "danger" : "success"}
              />
            )}
          </section>
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
      </CardBody>
    </Card>
  );
};
