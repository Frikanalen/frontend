"use client";

import { Alert, Button, Progress } from "@heroui/react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ProgramImage, RoleEnum } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  programImagesDestroy,
  programImagesPartialUpdate,
} from "@/generated/program-images/program-images";
import { formatApiError } from "@/lib/formatApiError";
import { useTusUpload } from "@/lib/upload/useTusUpload";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const imageRoles: ReadonlyArray<{ value: RoleEnum; label: string }> = [
  { value: RoleEnum.key_art_titled, label: "Nøkkelbilde med tittel" },
  { value: RoleEnum.key_art_untitled, label: "Nøkkelbilde uten tittel" },
  { value: RoleEnum.show_still, label: "Programbilde" },
  { value: RoleEnum.episode_still, label: "Episodebilde" },
  { value: RoleEnum.show_logo, label: "Programlogo" },
  { value: RoleEnum.behind_the_scenes, label: "Bak kulissene" },
  { value: RoleEnum.location, label: "Sted" },
  { value: RoleEnum.news_event, label: "Nyhetshendelse" },
  { value: RoleEnum.portrait_headshot, label: "Portrett, hode" },
  { value: RoleEnum.portrait_half_body, label: "Portrett, halvfigur" },
  { value: RoleEnum.portrait_full_body, label: "Portrett, helfigur" },
  { value: RoleEnum.cast_ensemble, label: "Gruppebilde" },
  { value: RoleEnum.channel_logo, label: "Kanallogo" },
  { value: RoleEnum.network_logo, label: "Nettverkslogo" },
];

const roleLabel = (role: RoleEnum) => imageRoles.find(({ value }) => value === role)?.label ?? role;

export const ProgramImageManager = ({
  videoId,
  uploadEndpoint,
  uploadToken,
  initialImages,
}: {
  videoId: string;
  uploadEndpoint: string;
  uploadToken: string;
  initialImages: ProgramImage[];
}) => {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<RoleEnum>(RoleEnum.key_art_titled);
  const [roleOverrides, setRoleOverrides] = useState<Record<number, RoleEnum>>({});
  const [unpublishedImageIds, setUnpublishedImageIds] = useState<Set<number>>(new Set());
  const [actionImageId, setActionImageId] = useState<number>();
  const [actionError, setActionError] = useState<string>();
  const [selectionError, setSelectionError] = useState<string>();
  const uploadMetadata = useMemo(() => ({ uploadKind: "program_image", imageRole: role }), [role]);
  const upload = useTusUpload(videoId, uploadToken, uploadEndpoint, uploadMetadata);
  const images = initialImages
    .filter(({ id }) => !unpublishedImageIds.has(id))
    .map((image) => ({ ...image, role: roleOverrides[image.id] ?? image.role }));

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

  const changeRole = async (image: ProgramImage, nextRole: RoleEnum) => {
    setActionError(undefined);
    setActionImageId(image.id);
    try {
      await programImagesPartialUpdate(image.id, { role: nextRole });
      setRoleOverrides((current) => ({ ...current, [image.id]: nextRole }));
      router.refresh();
    } catch (error) {
      setActionError(formatApiError(error));
    } finally {
      setActionImageId(undefined);
    }
  };

  const unpublish = async (image: ProgramImage) => {
    setActionError(undefined);
    setActionImageId(image.id);
    try {
      await programImagesDestroy(image.id);
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
          Last opp JPEG, PNG eller WebP, opptil 10 MB. Bildet blir kontrollert av ingest og
          publisert i mediearkivet sammen med videoen.
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
                alt={roleLabel(image.role)}
                loading="lazy"
                className="h-40 w-full rounded-md bg-default-100 object-contain"
              />
              <p className="text-sm text-default-500">
                {image.width} × {image.height} · {image.mediaType}
              </p>
              <label className="block space-y-1 text-sm">
                <span>Bildetype</span>
                <select
                  className="w-full rounded-md border border-default-300 bg-background px-3 py-2"
                  value={image.role}
                  disabled={actionImageId === image.id}
                  onChange={(event) => changeRole(image, event.target.value as RoleEnum)}
                >
                  {imageRoles.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
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
        <label className="block max-w-md space-y-1 text-sm">
          <span>Bildetype</span>
          <select
            className="w-full rounded-md border border-default-300 bg-background px-3 py-2"
            value={role}
            disabled={upload.isUploading}
            onChange={(event) => setRole(event.target.value as RoleEnum)}
          >
            {imageRoles.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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
