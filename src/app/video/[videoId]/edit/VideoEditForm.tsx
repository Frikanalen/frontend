"use client";
import { FormInput } from "@/components/FormField";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  LiveSource,
  PatchedVideoRequest,
  Series,
  Video,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { useRouter } from "next/navigation";
import { Button, Form } from "@heroui/react";

import { MDXEditorField } from "@/app/video/[videoId]/edit/MDXEditorField";
import { editAction } from "@/app/video/[videoId]/edit/editAction";
import { videosPartialUpdate } from "@/generated/videos/videos";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
import { SeriesFields } from "@/app/organization/[organizationId]/create/SeriesFields";
import type { SeriesOption } from "@/app/organization/[organizationId]/create/SeriesFields";
import { NewSeriesModal } from "@/app/organization/[organizationId]/create/NewSeriesModal";

export const VideoEditForm = ({
  video,
  series,
  liveSources = [],
}: {
  video: Video;
  series: Series[];
  /** The organization's live sources; the enabled ones can be chosen. */
  liveSources?: LiveSource[];
}) => {
  const form = useForm<PatchedVideoRequest>({
    defaultValues: {
      name: video.name,
      description: video.description,
      seriesId: video.series?.id ?? null,
      liveSource: video.liveSource ?? null,
    },
  });
  const { register, control } = form;
  const router = useRouter();
  const [availableSeries, setAvailableSeries] = useState<SeriesOption[]>(series);
  const [isSeriesModalOpen, setSeriesModalOpen] = useState(false);

  const selectSeries = (selected: SeriesOption | null) => {
    const originalSeriesId = video.series?.id ?? null;
    const selectedSeriesId = selected?.id ?? null;
    form.setValue(
      "episodeNumber",
      selectedSeriesId === originalSeriesId ? (video.episodeNumber ?? null) : null,
      { shouldDirty: true },
    );
  };

  const seriesCreated = (created: SeriesOption) => {
    setAvailableSeries((current) => [...current, created]);
    form.setValue("seriesId", created.id, { shouldDirty: true });
    form.setValue("episodeNumber", 1, { shouldDirty: true });
  };

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    // Sent only when changed: the API checks a source it's given, and a
    // source switched off since would otherwise block every other edit.
    const payload = { ...data };
    if (!form.formState.dirtyFields.liveSource) delete payload.liveSource;
    const update = await videosPartialUpdate(video.id, payload);
    if (update.status !== 200)
      throw new Error(`Failed to update video ${video.id} with status ${update.status}`);
    await editAction(video.id);
    router.push(`/video/${video.id}`);
  });

  return (
    <div>
      <Form onSubmit={onSubmit}>
        <FormError error={error} />
        <FormInput
          label={"Navn"}
          labelPlacement={"outside-top"}
          id="video-name"
          {...register("name")}
        />
        <MDXEditorField
          className={"w-full"}
          label={"Beskrivelse"}
          control={control}
          name={"description"}
        />
        <SeriesFields
          control={control}
          series={availableSeries}
          seriesName="seriesId"
          onCreateSeries={() => setSeriesModalOpen(true)}
          onSeriesChange={selectSeries}
        />
        {liveSources.length > 0 || video.liveSource != null ? (
          <label className="flex w-full flex-col gap-1 text-sm font-medium">
            Direktesending
            <select
              className="rounded-lg border border-default-300 bg-background px-3 py-2"
              {...register("liveSource", {
                setValueAs: (value) => (value === "" || value == null ? null : Number(value)),
              })}
            >
              <option value="">Ingen: sendes fra fil</option>
              {liveSources
                .filter(({ enabled, id }) => enabled || id === video.liveSource)
                .map(({ id, name }) => (
                  <option key={id} value={id}>
                    Direkte fra {name}
                  </option>
                ))}
            </select>
            <span className="text-xs font-normal text-default-500">
              En direktesending sendes direkte fra kilden helt til videoen har fått en fil.
            </span>
          </label>
        ) : null}
        <div className={"ml-auto"}>
          <Button type={"submit"} isPending={isSubmitting}>
            Send inn
          </Button>
        </div>
      </Form>
      <NewSeriesModal
        organizationId={video.organization.id}
        isOpen={isSeriesModalOpen}
        onOpenChange={setSeriesModalOpen}
        onCreated={seriesCreated}
      />
    </div>
  );
};
