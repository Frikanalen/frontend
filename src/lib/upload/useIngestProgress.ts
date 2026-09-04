"use client";
import type { IngestJob } from "@/generated/frikanalenDjangoAPI.schemas";
import { useVideosIngestRetrieve } from "@/generated/videos/videos";
import {
  describeIngestJob,
  ingestIsSettled,
  type IngestDescription,
} from "@/lib/upload/describeIngestJob";

/** How often to ask, while the answer can still change. */
export const POLL_INTERVAL_MS = 2000;

/**
 * Follows a video's ingest until it settles.
 *
 * The job is read from the start, but only described once `watching` -- that
 * is, once the upload this page is responsible for has landed. A video has a
 * single ingest job, so before then the job holds whatever was said about the
 * file being replaced, which is nothing to show the uploader. It is read all
 * the same, so that `reportedAt` can tell the two apart afterwards.
 *
 * `supersededAt` is that earlier report's time, handed back once the uploader
 * has moved on from it -- see `describeIngestJob`. It matters as much to the
 * polling as to the wording: polling stops at a settled job, and the previous
 * file's verdict must not be what stops us following this one.
 */
export const useIngestProgress = (
  videoId: number,
  watching: boolean,
  supersededAt?: string | null,
): { description: IngestDescription | null; reportedAt: string | null; isError: boolean } => {
  // One reading of the job, for both what we say and how long we keep asking:
  // deciding those separately is how a report about the previous file ends up
  // ending the poll. The clock stays describeIngestJob's, since reading it
  // here would be reading it during render.
  const describe = (job: IngestJob) => describeIngestJob(job, undefined, supersededAt);

  const { data, isError } = useVideosIngestRetrieve(videoId, {
    query: {
      refetchInterval: (query) => {
        if (!watching) return false;
        const job = query.state.data?.data;
        return job && ingestIsSettled(describe(job)) ? false : POLL_INTERVAL_MS;
      },
    },
  });

  const job = data?.data;

  return {
    description: watching && job ? describe(job) : null,
    /** When ingest last said anything, whoever it was about. */
    reportedAt: job?.updatedTime ?? null,
    isError,
  };
};
