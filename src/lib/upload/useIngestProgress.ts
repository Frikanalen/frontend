"use client";
import { useVideosIngestRetrieve } from "@/generated/videos/videos";
import {
  describeIngestJob,
  ingestIsSettled,
  type IngestDescription,
} from "@/lib/upload/describeIngestJob";

/** How often to ask, while the answer can still change. */
const POLL_INTERVAL_MS = 2000;

/**
 * Follows a video's ingest until it settles.
 *
 * Only starts once `enabled`, because before an upload finishes the answer is
 * a foregone `pending` that would only add noise. Polling stops the moment the
 * job reaches a state nothing further will be reported from.
 */
export const useIngestProgress = (
  videoId: number,
  enabled: boolean,
): { description: IngestDescription | null; isError: boolean } => {
  const { data, isError } = useVideosIngestRetrieve(videoId, {
    query: {
      enabled,
      refetchInterval: (query) => {
        const job = query.state.data?.data;
        if (!job) return POLL_INTERVAL_MS;
        return ingestIsSettled(describeIngestJob(job)) ? false : POLL_INTERVAL_MS;
      },
    },
  });

  return { description: data ? describeIngestJob(data.data) : null, isError };
};
