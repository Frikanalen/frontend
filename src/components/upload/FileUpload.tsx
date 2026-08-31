"use client";
import { Button, Link, Progress } from "@heroui/react";
import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { useTusUpload } from "@/lib/upload/useTusUpload";
import { useIngestProgress } from "@/lib/upload/useIngestProgress";
import { Alert } from "@heroui/alert";
import { useRouter } from "next/navigation";

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
  useEffect(() => {
    if (description?.phase !== "done") return;
    const timer = setTimeout(() => router.push(`/video/${videoId}`), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [description?.phase, router, videoId]);

  const isIngesting = isSuccess && description?.phase !== "done" && description?.phase !== "failed";

  return (
    <div className="space-y-4">
      <form>
        <input type={"file"} ref={ref} onChange={chooseFile} hidden />
      </form>

      <Progress value={progress} hidden={!isUploading} showValueLabel label={`Laster opp...`} />

      {isIngesting && (
        <Progress
          // Ingest reports progress within its current step, not across the
          // whole pipeline, so a step with nothing to report gets a bar that
          // says so rather than a misleading zero.
          value={description?.percentage ?? undefined}
          isIndeterminate={description?.percentage == null}
          showValueLabel={description?.percentage != null}
          label={description?.message ?? "Filen er lastet opp. Vi behandler den nå."}
        />
      )}

      {description?.phase === "stalled" && <Alert color="warning">{description.message}</Alert>}

      {isSuccess && ingestUnreachable && (
        <Alert color="warning" className={"prose dark:prose-invert"}>
          <p>
            Filen er lastet opp, men vi får ikke kontakt for å følge behandlingen. Se på{" "}
            <Link href={`/video/${videoId}`}>videosiden</Link> om litt.
          </p>
        </Alert>
      )}

      {description?.phase === "done" && (
        <Alert color="success" className={"prose dark:prose-invert"}>
          <h3>Videoen er klar!</h3>
          <p>
            Du blir sendt til <Link href={`/video/${videoId}`}>videosiden</Link>.
          </p>
        </Alert>
      )}

      {description?.phase === "failed" && (
        <div className={"space-y-4"}>
          <Alert color="danger">{description.message}</Alert>
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

      {isError && <Alert color="danger">Opplastingen feilet: {error?.message}</Alert>}

      {isReady && !isSuccess && !autoStart && (
        <div className={"prose dark:prose-invert"}>
          <Button onPress={start} disabled={!isReady}>
            Last opp {file?.name}
          </Button>
        </div>
      )}
    </div>
  );
};
