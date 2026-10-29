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
  | "error";

/**
 * Which of the source's two streams is playing. The Opus preview has sound
 * a browser can play; the original's AAC audio is dropped by WebRTC, so it
 * is used only when no preview is running.
 */
export type PreviewVariant = "preview" | "contribution";

// A member is likely to open this page before their encoder is running, so
// "no stream yet" is an expected state worth re-checking often.
const WAITING_RETRY_MS = 5_000;
const ERROR_RETRY_MS = 10_000;
const STATS_INTERVAL_MS = 1_000;

async function connect(sourceId: number) {
  const { data } = await liveSourcesPreviewTokenCreate(sourceId);
  const variants: [PreviewVariant, string][] = [
    ["preview", data.previewPath],
    ["contribution", data.contributionPath],
  ];
  for (const [variant, path] of variants) {
    try {
      return { session: await startWhep(whepUrl(path), data.token), variant };
    } catch (cause) {
      if (!(cause instanceof WhepError && cause.reason === "not-found")) throw cause;
    }
  }
  throw new WhepError("not-found", "Nothing is being published to this source");
}

export function useLivePreview(sourceId: number) {
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

    connect(sourceId)
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
        if (cause instanceof WhepError && cause.reason === "not-found") {
          setPhase("waiting");
          retryIn(WAITING_RETRY_MS);
        } else if (
          (cause instanceof WhepError && cause.reason === "unauthorized") ||
          (isAxiosError(cause) && [401, 403, 404].includes(cause.response?.status ?? 0))
        ) {
          setPhase("unauthorized");
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
  }, [attempt, sourceId, start]);

  return { phase, variant, stream, stats, error, start, stop, running: attempt > 0 };
}
