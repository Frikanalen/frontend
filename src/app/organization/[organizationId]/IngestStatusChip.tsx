"use client";
import { Chip } from "@heroui/react";
import { useVideosIngestRetrieve } from "@/generated/videos/videos";
import {
  describeIngestJob,
  ingestIsSettled,
  type IngestPhase,
} from "@/lib/upload/describeIngestJob";

/**
 * How often to ask again about a video whose ingest could still move.
 *
 * Slower than the upload page's two seconds: nobody is standing over this
 * list waiting for a bar to fill, and an organization with a dozen stuck
 * videos would be asking about all of them at once.
 */
const POLL_INTERVAL_MS = 10_000;

/**
 * What ingest never got round to saying anything about. A job the server
 * reports as `pending` with no `updated_time` is one nothing has ever
 * touched - in practice, a video that was created and then abandoned before
 * a file was ever chosen. Saying only that no processing has started is true
 * of that and of a file uploaded seconds ago alike, which is the point: the
 * poll below keeps running, so the moment ingest says anything the row says
 * it too.
 */
const NEVER_STARTED = "Ingen behandling er startet.";

const CHIP_COLORS: Record<IngestPhase, "default" | "primary" | "success" | "warning" | "danger"> = {
  waiting: "default",
  working: "primary",
  done: "success",
  failed: "danger",
  stalled: "warning",
};

/**
 * How far ingest has got with one video, for a list of them.
 *
 * The list this sits in used to call every unimported video "feil eller ikke
 * importert", which is the one thing the frontend already knew - and it is
 * wrong about most of them: a video is unimported for the whole time ingest
 * is probing, archiving and transcoding it, which is minutes of honest work
 * on a long programme. Asking the video's own ingest job tells the
 * difference between a queue, a transcode, a failure and an upload that was
 * never made, and `describeIngestJob` puts all four of them into the same
 * words the uploader saw on the way in.
 */
export const IngestStatusChip = ({ videoId }: { videoId: number }) => {
  const { data, isError } = useVideosIngestRetrieve(videoId, {
    query: {
      refetchInterval: (query) => {
        const job = query.state.data?.data;
        // A job that has finished or failed has nothing left to report; until
        // one arrives at all, keep asking.
        if (job && ingestIsSettled(describeIngestJob(job))) return false;
        return POLL_INTERVAL_MS;
      },
    },
  });

  // Ingest state is the admin's business alone, and a video is listed here
  // whether or not it can be read. Saying nothing beats an error chip on
  // every row.
  if (isError) return null;

  const job = data?.data;
  if (!job) return <Chip size="sm">Henter status...</Chip>;

  const description = describeIngestJob(job);
  const started = job.updatedTime !== null;

  return (
    <Chip
      size="sm"
      color={started ? CHIP_COLORS[description.phase] : "warning"}
      variant="flat"
      // The chip is a line of prose on a failure, not a word, so it has to be
      // allowed to wrap rather than run off the row.
      classNames={{ base: "h-auto max-w-full", content: "whitespace-normal py-1" }}
    >
      {started ? description.message : NEVER_STARTED}
      {started && description.percentage !== null && ` (${description.percentage} %)`}
    </Chip>
  );
};
