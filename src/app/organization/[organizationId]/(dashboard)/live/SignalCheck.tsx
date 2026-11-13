"use client";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { recentlyBroken } from "@/lib/live/history";
import { sourceStatus } from "@/lib/live/source";
import { readiness, type Readiness } from "@/lib/live/signal";
import cx from "classnames";
import Link from "next/link";
import { useEffect } from "react";
import { useSignalHistory } from "./SignalHistory";
import { SignalPanel } from "./SignalPanel";
import { useSignal } from "./SignalReport";
import { StreamVideo } from "./StreamVideo";
import { useLivePreview, useSilence, type PreviewPhase } from "./useLivePreview";
import { VuMeter } from "./VuMeter";

const VERDICT: Record<Readiness["level"], { title: string; className: string }> = {
  waiting: { title: "Venter på signal", className: "border-default-400" },
  ready: { title: "Klar for sending", className: "border-brand-green" },
  check: { title: "Kan sendes, men sjekk dette først", className: "border-warning" },
  problem: { title: "Ikke klar for sending", className: "border-danger" },
};

const previewTrouble = (phase: PreviewPhase, error: string | null) =>
  phase === "unauthorized"
    ? "Du har ikke tilgang til å se denne kilden. Last inn siden på nytt og prøv igjen."
    : phase === "unsupported"
      ? "Nettleseren din kan ikke spille av forhåndsvisningen. Prøv en annen nettleser."
      : phase === "error"
        ? `Forhåndsvisningen kunne ikke kobles til (${error}). Prøver igjen straks.`
        : null;

/**
 * The check before a broadcast, as one answer and its evidence: is this
 * source ready to go on air. The answer comes from what the receiver sees
 * of the signal; the picture and the sound meter are for the two things
 * only a person can judge, that it is the right picture and the right
 * sound.
 */
export const SignalCheck = ({
  source,
  setupHref,
}: {
  source: LiveSource;
  /** Where the source's encoders are managed, when the page can lead there. */
  setupHref?: string;
}) => {
  const { phase, variant, stream, stats, error, start } = useLivePreview(source.id);
  const enabled = source.enabled !== false;
  const { signal, previous, history: live } = useSignal(source.id, { enabled, open: true });
  const history = useSignalHistory(source.id, live, { enabled });
  const silent = useSilence(stats);

  // Watching is what makes Frikanalen fetch a pulled source, and for any
  // source the picture is half of the check.
  useEffect(() => {
    if (enabled) start();
  }, [enabled, start]);

  const seen = phase === "playing";
  const verdict = readiness({
    signal,
    previous,
    pulled: source.isPulled,
    silent,
    unstable: recentlyBroken(history),
  });
  // Where the receiver cannot be asked, the preview is all there is to go on.
  const { title, className } =
    !signal && seen
      ? { title: "Signalet kommer fram", className: "border-brand-green" }
      : VERDICT[verdict.level];
  const trouble = previewTrouble(phase, error);

  if (!enabled)
    return (
      <p className="border-l-4 border-warning bg-content1 p-4" role="status">
        Kilden er slått av og tar ikke imot signal. Slå den på under Oppsett.
      </p>
    );
  // Nothing can come in, so there is nothing to wait for or look at.
  if (setupHref && sourceStatus(source, signal) === "no-encoder")
    return (
      <div className="space-y-2 border-l-8 border-warning bg-content1 p-4" role="status">
        <p className="text-2xl font-bold">Mangler koder</p>
        <p className="text-default-700">
          Ingen koder er koblet til kilden, så den kan ikke ta imot signal.
        </p>
        <Link
          className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
          href={setupHref}
        >
          Koble til en koder
        </Link>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className={cx("border-l-8 bg-content1 p-4", className)} role="status">
        <p className="text-2xl font-bold">{title}</p>
        {verdict.level === "waiting" && !seen ? (
          <p className="mt-1 text-default-700">
            {source.isPulled
              ? `Vi kobler til ${source.pullTarget}. Sjekk at adressen stemmer og at det sendes derfra.`
              : "Start sendingen i koderen. Siden oppdager signalet av seg selv."}
          </p>
        ) : null}
        {verdict.level === "ready" || (!signal && seen) ? (
          <p className="mt-1 text-default-700">
            Se selv at det er riktig bilde, og at lydmåleren beveger seg med lyden dere sender.
          </p>
        ) : null}
        {verdict.reasons.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 ps-5">
            {verdict.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <StreamVideo
            className="aspect-video w-full bg-black"
            label={`Forhåndsvisning av ${source.name}`}
            stream={stream}
          />
          <p className="text-sm text-default-600">
            Forhåndsvisningen er en liten kopi i lav kvalitet. Den viser at bilde og lyd kommer
            fram, ikke hvor godt bildet ser ut på lufta.
          </p>
          {trouble ? <p className="text-sm text-danger-700">{trouble}</p> : null}
          {seen ? (
            <section className="space-y-1">
              <h3 className="font-semibold">Lydnivå</h3>
              <VuMeter stream={stream} />
              <p className="text-xs text-default-600">
                {variant === "contribution"
                  ? "Lyden kan ikke forhåndsvises her, bare bildet."
                  : "Forhåndsvisningen starter uten lyd. Slå på lyden i spilleren for å høre; måleren virker uansett."}
              </p>
            </section>
          ) : null}
        </div>
        {signal ? (
          <section aria-labelledby="signal-panel" className="space-y-2">
            <h3 className="font-semibold" id="signal-panel">
              Signalet deres
            </h3>
            <SignalPanel
              history={history}
              previous={previous}
              pulled={source.isPulled}
              signal={signal}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
};
