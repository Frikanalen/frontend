import { IngestStateEnum, type IngestJob } from "@/generated/frikanalenDjangoAPI.schemas";

/**
 * How long an ingest may go without a word from the server before we stop
 * claiming it is still working. Nothing cancels a job when its process dies,
 * so a stale `transcoding` would otherwise spin forever.
 */
export const STALE_AFTER_MS = 20 * 60 * 1000;

export type IngestPhase = "waiting" | "working" | "done" | "failed" | "stalled";

export interface IngestDescription {
  phase: IngestPhase;
  /** What to tell the uploader. Norwegian: ingest reports codes, we choose words. */
  message: string;
  /** 0-100 within the current state, or null where there is nothing honest to show. */
  percentage: number | null;
}

const STATE_MESSAGES: Record<IngestStateEnum, string> = {
  [IngestStateEnum.pending]: "Filen ligger i kø.",
  [IngestStateEnum.probing]: "Vi ser på filen du sendte.",
  [IngestStateEnum.archiving]: "Vi tar vare på originalfilen.",
  [IngestStateEnum.transcoding]: "Vi lager visningskopier.",
  [IngestStateEnum.done]: "Videoen er klar.",
  [IngestStateEnum.failed]: "Noe gikk galt under behandlingen.",
};

/**
 * The error codes ingest reports, in words. Anything unrecognised falls back
 * to a sentence that still tells the uploader what to do, because a code we
 * have not seen before is still a failure they need to act on.
 */
const ERROR_MESSAGES: Record<string, string> = {
  not_compliant:
    "Filformatet kan ikke sendes i kanalen. Prøv å eksportere videoen på nytt, for eksempel som MP4 med H.264.",
  unreadable: "Vi klarte ikke å lese filen. Er den fullstendig, og er det virkelig en videofil?",
  archive_failed: "Vi klarte ikke å lagre filen hos oss. Prøv igjen, eller si fra til oss.",
  transcode_failed:
    "Vi klarte ikke å lage visningskopier av filen. Si fra til oss, så ser vi på det.",
  internal_error: "Det oppsto en feil hos oss. Si fra til oss, så ser vi på det.",
};

const FAILURE_FALLBACK = "Behandlingen stoppet. Si fra til oss, så ser vi på det.";

const STALLED_MESSAGE =
  "Behandlingen ser ut til å ha stoppet opp. Si fra til oss, så ser vi på det.";

const isStale = (updatedTime: string, now: number): boolean =>
  now - new Date(updatedTime).getTime() > STALE_AFTER_MS;

/**
 * Turns an ingest job into something to show a person waiting for their
 * upload. Kept apart from the component so the wording can be tested without
 * rendering anything, and so ingest never has to know any Norwegian.
 */
export const describeIngestJob = (job: IngestJob, now: number = Date.now()): IngestDescription => {
  if (job.state === IngestStateEnum.failed) {
    return {
      phase: "failed",
      message: (job.errorCode && ERROR_MESSAGES[job.errorCode]) || FAILURE_FALLBACK,
      percentage: null,
    };
  }

  if (job.state === IngestStateEnum.done) {
    return { phase: "done", message: STATE_MESSAGES[job.state], percentage: 100 };
  }

  // A job that has never been reported has no timestamp to go stale, and one
  // that is merely queued is not stuck -- it has not started.
  if (job.state !== IngestStateEnum.pending && job.updatedTime && isStale(job.updatedTime, now)) {
    return { phase: "stalled", message: STALLED_MESSAGE, percentage: null };
  }

  return {
    phase: job.state === IngestStateEnum.pending ? "waiting" : "working",
    message: STATE_MESSAGES[job.state],
    percentage: job.percentageDone ?? null,
  };
};

/** Whether another report is still expected. */
export const ingestIsSettled = (description: IngestDescription): boolean =>
  description.phase === "done" || description.phase === "failed";
