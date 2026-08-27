"use client";

import { Alert, Button, Progress } from "@heroui/react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ProgramImage, RoleEnum } from "@/generated/frikanalenDjangoAPI.schemas";
import { videosImagesDestroy } from "@/generated/videos/videos";
import { formatApiError } from "@/lib/formatApiError";
import { useTusUpload } from "@/lib/upload/useTusUpload";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Frikanalen publishes one kind of image: the promotional still that TV-Anytime calls
// urn:tva:metadata:cs:HowRelatedCS:2012:19, so the role is not the editor's to pick.
// TODO: no RoleEnum member means "promotional still" yet; key_art_titled is a placeholder
// until the API grows one (or carries the TVA term itself).
const PROMOTIONAL_ROLE: RoleEnum = RoleEnum.key_art_titled;

export const ProgramImageManager = ({
  videoId,
  uploadEndpoint,
  uploadToken,
  initialImages,
}: {
  videoId: number;
  uploadEndpoint: string;
  uploadToken: string;
  initialImages: ProgramImage[];
}) => {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [unpublishedImageIds, setUnpublishedImageIds] = useState<Set<number>>(new Set());
  const [actionImageId, setActionImageId] = useState<number>();
  const [actionError, setActionError] = useState<string>();
  const [selectionError, setSelectionError] = useState<string>();
  const uploadMetadata = useMemo(
    () => ({ uploadKind: "program_image", imageRole: PROMOTIONAL_ROLE }),
    [],
  );
  const upload = useTusUpload(String(videoId), uploadToken, uploadEndpoint, uploadMetadata);
  const images = initialImages.filter(({ id }) => !unpublishedImageIds.has(id));

  useEffect(() => {
    if (upload.isSuccess) router.refresh();
  }, [router, upload.isSuccess]);

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectionError(undefined);
    const file = event.target.files?.[0];
    if (file && file.size > MAX_IMAGE_BYTES) {
      setSelectionError("Bildet kan ikke være større enn 10 MB.");
      event.target.value = "";
      upload.onFileListChange(event);
      return;
    }
    if (file?.type && !ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setSelectionError("Velg et JPEG-, PNG- eller WebP-bilde.");
      event.target.value = "";
      upload.onFileListChange(event);
      return;
    }
    upload.onFileListChange(event);
  };

  const unpublish = async (image: ProgramImage) => {
    setActionError(undefined);
    setActionImageId(image.id);
    try {
      await videosImagesDestroy(videoId, image.id);
      setUnpublishedImageIds((current) => new Set(current).add(image.id));
      router.refresh();
    } catch (error) {
      setActionError(formatApiError(error));
    } finally {
      setActionImageId(undefined);
    }
  };

  return (
    <section className="space-y-5 border-t border-default-200 pt-6">
      <div className="prose dark:prose-invert">
        <h2>Bilder</h2>
        <p>
          Last opp et promobilde — JPEG, PNG eller WebP, opptil 10 MB. Bildet blir kontrollert
          av ingest og publisert i mediearkivet sammen med videoen.
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <article key={image.id} className="rounded-lg border border-default-200 p-3 space-y-3">
              {/* The archive URL is runtime configuration, so it cannot be allow-listed at build time. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Promobilde"
                loading="lazy"
                className="h-40 w-full rounded-md bg-default-100 object-contain"
              />
              <p className="text-sm text-default-500">
                {image.width} × {image.height} · {image.mediaType}
              </p>
              <Button
                color="danger"
                variant="light"
                isLoading={actionImageId === image.id}
                onPress={() => unpublish(image)}
              >
                Fjern fra publisering
              </Button>
            </article>
          ))}
        </div>
      )}

      {actionError && <Alert color="danger">{actionError}</Alert>}

      <div className="space-y-3 rounded-lg bg-default-50 p-4">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={selectImage}
          hidden
        />

        {selectionError && <Alert color="danger">{selectionError}</Alert>}
        {upload.isError && (
          <Alert color="danger">Opplastingen feilet: {upload.error?.message}</Alert>
        )}
        {upload.isSuccess && (
          <Alert color="success">Bildet er kontrollert og lagt i mediearkivet.</Alert>
        )}
        {upload.isUploading && (
          <Progress value={upload.progress} showValueLabel label="Laster opp bilde …" />
        )}

        <div className="flex flex-wrap gap-3">
          <Button onPress={() => fileInput.current?.click()} disabled={upload.isUploading}>
            Velg bilde
          </Button>
          {upload.isReady && (
            <Button color="primary" onPress={upload.start}>
              Last opp {upload.file?.name}
            </Button>
          )}
          {upload.isUploading && (
            <Button variant="light" onPress={upload.abort}>
              Avbryt
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};
