"use client";
import { Button, Modal, ProgressBar } from "@heroui/react";
import { Notice } from "@/components/Notice";
import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
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

/**
 * The video's picture at the top of the edit page, and the way into managing
 * its promotional images. Images are saved the moment they are uploaded or
 * removed, apart from the form's "Lagre", so they live in their own dialog.
 */
export const ProgramImageManager = ({
  videoId,
  uploadEndpoint,
  uploadToken,
  initialImages,
  fallbackThumbnail,
}: {
  videoId: number;
  uploadEndpoint: string;
  uploadToken: string;
  initialImages: ProgramImage[];
  /** A frame from the video, shown while it has no promotional image. */
  fallbackThumbnail?: string;
}) => {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isOpen, setOpen] = useState(false);
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
  const cover = images[0];

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
    if (!window.confirm("Fjerne bildet fra publisering? Det kan ikke angres.")) return;
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

  const thumbnail = cover?.url ?? fallbackThumbnail;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          // Upload tokens are short-lived and deleted once the video's own
          // file is ingested, so the one this page was rendered with may be
          // gone by now. Re-rendering fetches the live one.
          router.refresh();
        }}
        className="group relative block aspect-video w-full max-w-72 shrink-0 overflow-hidden rounded-md bg-default text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:w-56"
        aria-label="Endre bilde"
      >
        {thumbnail ? (
          // The archive URL is runtime configuration, so it cannot be allow-listed at build time.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-sm text-foreground-500">
            Ingen bilde
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
          {cover
            ? "Eget bilde · endre"
            : thumbnail
              ? "Bilde fra videoen · endre"
              : "Legg til bilde"}
        </span>
      </button>

      <Modal isOpen={isOpen} onOpenChange={setOpen}>
        <Modal.Backdrop isDismissable={!upload.isUploading}>
          <Modal.Container
            size="lg"
            scroll="inside"
            className="m-0 h-[100dvh] max-h-[100dvh] max-w-full rounded-none sm:m-6 sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-3xl sm:rounded-large"
          >
            <Modal.Dialog>
              <Modal.Header className="px-4 sm:px-6">
                <Modal.Heading>Bilde</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="w-full min-w-0 space-y-4 px-4 sm:px-6">
                <p className="text-sm text-foreground-500">
                  Bildet vises i arkivet og i programguider. Uten et eget bilde brukes et bilde fra
                  selve videoen. Eget bilde: JPEG, PNG eller WebP, opptil 10 MB. Endringer her
                  lagres med en gang.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {images.map((image, index) => (
                    <ImageCard
                      key={image.id}
                      src={image.url}
                      title="Eget bilde"
                      isInUse={index === 0}
                      detail={`${image.width} × ${image.height} · ${image.mediaType}`}
                    >
                      <Button
                        size="sm"
                        variant="tertiary"
                        isPending={actionImageId === image.id}
                        onPress={() => unpublish(image)}
                      >
                        Fjern
                      </Button>
                    </ImageCard>
                  ))}
                  {fallbackThumbnail && (
                    <ImageCard
                      src={fallbackThumbnail}
                      title="Bilde fra videoen"
                      isInUse={!cover}
                      detail={
                        cover
                          ? "Brukes igjen hvis du fjerner det egne bildet."
                          : "Lages automatisk fra videoen."
                      }
                    />
                  )}
                </div>

                {actionError && <Notice status="danger">{actionError}</Notice>}
                {selectionError && <Notice status="danger">{selectionError}</Notice>}
                {upload.isError && (
                  <Notice status="danger">Opplastingen feilet: {upload.error?.message}</Notice>
                )}
                {upload.isSuccess && (
                  <Notice status="success">
                    Bildet er lastet opp. Det vises her når det er kontrollert.
                  </Notice>
                )}
                {upload.isUploading && (
                  <ProgressBar value={upload.progress} aria-label="Laster opp bilde …">
                    <span>Laster opp bilde …</span>
                    <ProgressBar.Output />
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                )}

                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selectImage}
                  hidden
                />
              </Modal.Body>
              <Modal.Footer className="w-full flex-wrap px-4 sm:px-6">
                {upload.isUploading ? (
                  <Button variant="tertiary" onPress={upload.abort}>
                    Avbryt opplastingen
                  </Button>
                ) : (
                  <Button variant="tertiary" onPress={() => setOpen(false)}>
                    Lukk
                  </Button>
                )}
                {upload.isReady ? (
                  <Button onPress={upload.start} variant="primary">
                    Last opp {upload.file?.name}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onPress={() => fileInput.current?.click()}
                    isDisabled={upload.isUploading}
                  >
                    {cover ? "Last opp nytt bilde" : "Last opp eget bilde"}
                  </Button>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
};

const ImageCard = ({
  src,
  title,
  detail,
  isInUse,
  children,
}: {
  src: string;
  title: string;
  detail: string;
  isInUse: boolean;
  children?: ReactNode;
}) => (
  <article
    className={`space-y-2 rounded-lg border p-3 ${isInUse ? "border-primary" : "border-default"}`}
  >
    {/* The archive URL is runtime configuration, so it cannot be allow-listed at build time. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt={title}
      loading="lazy"
      className="aspect-video w-full rounded-md bg-default object-contain"
    />
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="text-sm font-medium">
          {title}
          {isInUse && (
            <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              I bruk
            </span>
          )}
        </p>
        <p className="text-xs text-foreground-500">{detail}</p>
      </div>
      {children}
    </div>
  </article>
);
