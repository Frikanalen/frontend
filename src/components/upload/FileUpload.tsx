"use client";
import { Button, Link, Progress } from "@heroui/react";
import { useRef } from "react";
import { useTusUpload } from "@/lib/upload/useTusUpload";
import { Alert } from "@heroui/alert";

export const FileUpload = ({
  videoId,
  uploadEndpoint,
  uploadToken,
}: {
  videoId: string;
  uploadEndpoint: string;
  uploadToken: string | undefined;
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
  } = useTusUpload(videoId, uploadToken, uploadEndpoint);
  return (
    <div>
      <form>
        <input type={"file"} ref={ref} onChange={onFileListChange} hidden />
      </form>
      <Progress value={progress} hidden={!isUploading} showValueLabel label={`Laster opp...`} />
      {isSuccess && (
        <Alert color="success" className={"prose dark:prose-invert"}>
          <h3>Videoen er lastet opp!</h3>
          <p>Det vil ta noe tid før kopier blir ferdige og videoen blir synlig.</p>
          <p>
            Når den er ferdig, vil den være tilgjengelig på{" "}
            <Link href={`/video/${videoId}`}>videosiden</Link>
          </p>
        </Alert>
      )}
      {!file && (
        <div className={"flex flex-col gap-4 w-fit"}>
          <div>
            <p>Velg en fil å laste opp.</p>
          </div>
          <div>
            <Button onPress={() => ref.current?.click()}>Velg fil</Button>
          </div>
        </div>
      )}
      {isError && <Alert color="danger">Error: ${error?.message}</Alert>}
      {isReady && (
        <div className={"prose dark:prose-invert"}>
          <Button onPress={start} disabled={!isReady}>
            Last opp {file?.name}
          </Button>
        </div>
      )}
    </div>
  );
};
