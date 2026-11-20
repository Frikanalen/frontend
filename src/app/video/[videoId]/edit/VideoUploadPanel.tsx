"use client";
import { useEffect, useState } from "react";
import { IngestStatusChip } from "@/app/organization/[organizationId]/IngestStatusChip";
import { clearUpload, peekUpload } from "@/app/organization/[organizationId]/create/pendingUploads";
import { FileUpload } from "@/components/upload/FileUpload";

/**
 * The video's file, on the video's own page: the upload started on "Ny
 * video" carries on here while the member fills in the form below, and a
 * video still without a finished file says where it stands and takes one.
 * Nothing is shown for a video that has its file, or that airs live.
 */
export const VideoUploadPanel = ({
  videoId,
  uploadEndpoint,
  uploadToken,
  needsFile,
}: {
  videoId: number;
  uploadEndpoint: string;
  uploadToken: string;
  /** No finished file yet, and not a live programme. */
  needsFile: boolean;
}) => {
  const [file, setFile] = useState(() => peekUpload(videoId));
  useEffect(() => clearUpload(videoId), [videoId]);

  if (!file && !needsFile) return null;

  return (
    <section
      aria-label="Videofil"
      className="mb-6 space-y-3 border border-default-200 bg-content1 p-4"
    >
      {file ? (
        <>
          <h2 className="font-semibold">Laster opp {file.name}</h2>
          <p className="text-sm text-default-600">
            La siden være åpen til filen er lastet opp. Fyll gjerne inn resten imens.
          </p>
        </>
      ) : (
        <>
          <h2 className="font-semibold">Videoen har ingen ferdig fil ennå</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <IngestStatusChip videoId={videoId} />
          </div>
        </>
      )}
      <FileUpload
        videoId={videoId}
        uploadEndpoint={uploadEndpoint}
        uploadToken={uploadToken}
        initialFile={file}
        autoStart={!!file}
        onFileChange={setFile}
        doneHref={null}
      />
    </section>
  );
};
