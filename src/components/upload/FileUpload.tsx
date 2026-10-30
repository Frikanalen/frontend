"use client";
import Link from "next/link";
import { Button, ProgressBar } from "@heroui/react";
import { Notice } from "@/components/Notice";
import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { useTusUpload } from "@/lib/upload/useTusUpload";
import { POLL_INTERVAL_MS, useIngestProgress } from "@/lib/upload/useIngestProgress";

import { useRouter } from "next/navigation";
import { useVideosRetrieve } from "@/generated/videos/videos";

/** How long the "klar" message stays up before we move the user along. */
const REDIRECT_DELAY_MS = 2000;

export const FileUpload = ({
  videoId,
  uploadEndpoint,
  uploadToken,
  initialFile,
  autoStart = false,
  onFileChange,
}: {
  videoId: number;
  uploadEndpoint: string;
  uploadToken: string | undefined;
  initialFile?: File;
  autoStart?: boolean;
  /** Told which file is on its way up, so a caller naming it can keep up. */
  onFileChange?: (_file: File) => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  // fixme: this is probably not really nullable, this is just a DB schema issue.
  if (!uploadToken) throw new Error("No upload token provided");
  const {
    onFileListChange,
    start,
    isReady,
    progress,
    file,
    isUploading,
    isError,
    error,
    isSuccess,
  } = useTusUpload(String(videoId), uploadToken, uploadEndpoint, undefined, initialFile);

  useEffect(() => {
    if (autoStart && isReady) start();
  }, [autoStart, isReady, start]);

  // A video has a single ingest job, so picking a new file after a failure
  // leaves the old file's verdict in place until ingest gets round to the new
  // one. Remembering when that verdict was made keeps it from being shown --
  // and, worse, from being taken as a settled job that ends the polling --
  // while the replacement is on its way up. Undefined until a file is replaced.
  const [supersededAt, setSupersededAt] = useState<string | null | undefined>(undefined);

  // Transferring the bytes is only the first half. Until ingest has probed,
  // archived and transcoded the file there is nothing to watch on the video
  // page, and the upload may still fail in a way the browser never sees.
  const {
    description,
    reportedAt,
    isError: ingestUnreachable,
  } = useIngestProgress(videoId, isSuccess, supersededAt);

  const chooseFile = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      // Whatever ingest last said was about the file being put aside here.
      setSupersededAt(reportedAt);
      onFileListChange(event);
      const chosen = event.target.files?.[0];
      if (chosen) onFileChange?.(chosen);
    },
    [onFileChange, onFileListChange, reportedAt],
  );

  const router = useRouter();
  const { data: videoResponse } = useVideosRetrieve(videoId, {
    query: {
      enabled: isSuccess,
      refetchInterval: (query) =>
        query.state.data?.data.files.dashPreview ? false : POLL_INTERVAL_MS,
    },
  });
  const previewReady = Boolean(videoResponse?.data.files.dashPreview);

  useEffect(() => {
    if (previewReady) {
      router.push(`/video/${videoId}`);
      return;
    }
    if (description?.phase !== "done") return;
    const timer = setTimeout(() => router.push(`/video/${videoId}`), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [description?.phase, previewReady, router, videoId]);

  const isIngesting = isSuccess && description?.phase !== "done" && description?.phase !== "failed";

  return (
    <div className="space-y-4">
      <form>
        <input type={"file"} ref={ref} onChange={chooseFile} hidden />
      </form>

      {isUploading && (
        <ProgressBar value={progress} aria-label="Laster opp...">
          <span>Laster opp...</span>
          <ProgressBar.Output />
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      )}

      {isIngesting && (
        <ProgressBar
          // Ingest reports progress within its current step, not across the
          // whole pipeline, so a step with nothing to report gets a bar that
          // says so rather than a misleading zero.
          value={description?.percentage ?? undefined}
          aria-label={description?.message ?? "Filen er lastet opp. Vi behandler den nå."}
        >
          <span>{description?.message ?? "Filen er lastet opp. Vi behandler den nå."}</span>
          <ProgressBar.Output />
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      )}

      {description?.phase === "stalled" && <Notice status="warning">{description.message}</Notice>}

      {isSuccess && ingestUnreachable && (
        <Notice status="warning" className={"prose dark:prose-invert"}>
          <p>
            Filen er lastet opp, men vi får ikke kontakt for å følge behandlingen. Se på{" "}
            <Link href={`/video/${videoId}`}>videosiden</Link> om litt.
          </p>
        </Notice>
      )}

      {description?.phase === "done" && (
        <Notice status="success" className={"prose dark:prose-invert"}>
          <h3>Videoen er klar!</h3>
          <p>
            Du blir sendt til <Link href={`/video/${videoId}`}>videosiden</Link>.
          </p>
        </Notice>
      )}

      {description?.phase === "failed" && (
        <div className={"space-y-4"}>
          <Notice status="danger">{description.message}</Notice>
          <Button onPress={() => ref.current?.click()}>Velg en annen fil</Button>
        </div>
      )}

      {!file && !isSuccess && (
        <div className={"flex flex-col gap-4 w-fit"}>
          <div>
            <p>Velg en fil å laste opp.</p>
          </div>
          <div>
            <Button onPress={() => ref.current?.click()}>Velg fil</Button>
          </div>
        </div>
      )}

      {isError && <Notice status="danger">Opplastingen feilet: {error?.message}</Notice>}

      {isReady && !isSuccess && !autoStart && (
        <div className={"prose dark:prose-invert"}>
          <Button onPress={start} isDisabled={!isReady}>
            Last opp {file?.name}
          </Button>
        </div>
      )}
    </div>
  );
};
