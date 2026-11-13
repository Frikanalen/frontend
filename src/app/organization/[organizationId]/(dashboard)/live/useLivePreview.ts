"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { liveSourcesPreviewTokenCreate } from "@/generated/live-sources/live-sources";
import { startWhep, WhepError, whepUrl, type WhepSession } from "@/lib/live/whep";
import { summarizeStats, type StreamStats } from "@/lib/live/streamStats";

export type PreviewPhase =
  | "idle"
  | "connecting"
  /** Nothing is being published to this source yet; we keep asking. */
  | "waiting"
  | "playing"
  | "unauthorized"
  /** The browser cannot decode the feed's video, so retrying won't help. */
  | "unsupported"
  /** The receiver has no programme return here; nothing to wait for. */
  | "absent"
  | "error";

// A member is likely to open this page before their encoder is running, so
// "no stream yet" is an expected state worth re-checking often.
const WAITING_RETRY_MS = 5_000;
const ERROR_RETRY_MS = 10_000;
const STATS_INTERVAL_MS = 1_000;

/**
 * Which of the source's two streams is playing. MediaMTX converts the
 * preview's audio to Opus, which a browser can play and meter; WebRTC drops
 * the original's AAC, so the original is the fallback for a picture only.
 */
export type PreviewVariant = "preview" | "contribution";

/**
 * What to watch: the source's own signal, or the programme return, the
 * channel's output coming back with about a second's delay. The source's
 * token opens both.
 */
export type PreviewTarget = "source" | "program";

class NoProgramReturn extends Error {}

async function connect(sourceId: number, target: PreviewTarget) {
  const { data } = await liveSourcesPreviewTokenCreate(sourceId);
  if (target === "program") {
    if (!data.programPath) throw new NoProgramReturn();
    const session = await startWhep(whepUrl(data.programPath), data.token);
    return { session, variant: "preview" as const };
  }
  try {
    const session = await startWhep(whepUrl(data.previewPath), data.token);
    return { session, variant: "preview" as const };
  } catch (cause) {
    // The preview copies the original's video, so a codec the browser can't
    // play rules out both.
    if (
      cause instanceof WhepError &&
      (cause.reason === "unauthorized" || cause.reason === "unsupported-codec")
    )
      throw cause;
    // Where MediaMTX runs no converter the preview path is not configured,
    // which it answers with 400 rather than 404: any other failure falls
    // through to the original.
    console.warn("Opus preview unavailable, showing the original:", cause);
  }
  const session = await startWhep(whepUrl(data.contributionPath), data.token);
  return { session, variant: "contribution" as const };
}

export function useLivePreview(sourceId: number, target: PreviewTarget = "source") {
  const [phase, setPhase] = useState<PreviewPhase>("idle");
  const [variant, setVariant] = useState<PreviewVariant | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped to start (or restart) a connection; 0 means stopped.
  const [attempt, setAttempt] = useState(0);
  const sessionRef = useRef<WhepSession | null>(null);

  // Every (re)connection goes through here, so "waiting" survives a retry
  // instead of flickering to "connecting" every few seconds.
  const start = useCallback(() => {
    setPhase((current) => (current === "waiting" ? current : "connecting"));
    setAttempt((n) => n + 1);
  }, []);
  const stop = useCallback(() => {
    setAttempt(0);
    setPhase("idle");
    setStream(null);
    setStats(null);
  }, []);

  useEffect(() => {
    if (attempt === 0) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;
    const retryIn = (ms: number) => {
      retry = setTimeout(() => !cancelled && start(), ms);
    };

    connect(sourceId, target)
      .then(({ session, variant }) => {
        if (cancelled) return session.close();
        sessionRef.current = session;
        setVariant(variant);
        setStream(session.stream);
        setStats(null);
        setError(null);
        setPhase("playing");

        let samples: StreamStats["samples"] = {};
        poll = setInterval(async () => {
          const summary = summarizeStats(await session.pc.getStats(), samples);
          samples = summary.samples;
          if (!cancelled) setStats(summary);
        }, STATS_INTERVAL_MS);

        // MediaMTX ends the session when the encoder stops; go back to
        // waiting for it rather than showing a frozen frame.
        session.pc.addEventListener("connectionstatechange", () => {
          const state = session.pc.connectionState;
          if (cancelled || (state !== "failed" && state !== "closed")) return;
          setPhase("waiting");
          start();
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setStream(null);
        setStats(null);
        if (cause instanceof NoProgramReturn) {
          setPhase("absent");
        } else if (cause instanceof WhepError && cause.reason === "not-found") {
          setPhase("waiting");
          retryIn(WAITING_RETRY_MS);
        } else if (
          (cause instanceof WhepError && cause.reason === "unauthorized") ||
          (isAxiosError(cause) && [401, 403, 404].includes(cause.response?.status ?? 0))
        ) {
          setPhase("unauthorized");
        } else if (cause instanceof WhepError && cause.reason === "unsupported-codec") {
          setPhase("unsupported");
        } else {
          setError(cause instanceof Error ? cause.message : String(cause));
          setPhase("error");
          retryIn(ERROR_RETRY_MS);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(retry);
      clearInterval(poll);
      sessionRef.current?.close();
      sessionRef.current = null;
    };
  }, [attempt, sourceId, start, target]);

  return { phase, variant, stream, stats, error, start, stop, running: attempt > 0 };
}

// Quieter than any room with an open microphone; the browser reports
// levels from 0 to 1.
const SILENCE_LEVEL = 0.002;
const SILENCE_AFTER_MS = 8_000;

/**
 * Whether a playing preview has gone without sound for a while. False
 * where the browser reports no level, rather than a guess.
 */
export function useSilence(stats: StreamStats | null) {
  const level = stats?.audio?.level ?? null;
  const [heardAt, setHeardAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const sample = stats?.samples.audio?.timestamp ?? 0;
  if (sample !== now) {
    setNow(sample);
    if (level === null) setHeardAt(null);
    else if (level > SILENCE_LEVEL || heardAt === null) setHeardAt(sample);
  }
  return level !== null && heardAt !== null && now - heardAt > SILENCE_AFTER_MS;
}
