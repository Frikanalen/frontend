"use client";
import { useForm } from "react-hook-form";
import { PatchedVideoRequest, Series, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useRouter } from "next/navigation";
import { Button, Form, Input } from "@heroui/react";

import { MDXEditorField } from "@/app/video/[videoId]/edit/MDXEditorField";
import { editAction } from "@/app/video/[videoId]/edit/editAction";
import { videosPartialUpdate } from "@/generated/videos/videos";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
import { SeriesFields } from "@/app/organization/[organizationId]/create/SeriesFields";
import type { SeriesOption } from "@/app/organization/[organizationId]/create/SeriesFields";

export const VideoEditForm = ({ video, series }: { video: Video; series: Series[] }) => {
  const form = useForm<PatchedVideoRequest>({
    defaultValues: {
      name: video.name,
      description: video.description,
      seriesId: video.series?.id ?? null,
    },
  });
  const { register, control } = form;
  const router = useRouter();

  const selectSeries = (selected: SeriesOption | null) => {
    const originalSeriesId = video.series?.id ?? null;
    const selectedSeriesId = selected?.id ?? null;
    form.setValue(
      "episodeNumber",
      selectedSeriesId === originalSeriesId ? (video.episodeNumber ?? null) : null,
      { shouldDirty: true },
    );
  };

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (payload) => {
    const update = await videosPartialUpdate(video.id.toString(), payload);
    if (update.status !== 200)
      throw new Error(`Failed to update video ${video.id} with status ${update.status}`);
    await editAction(video.id);
    router.push(`/video/${video.id}`);
  });

  return (
    <div>
      <Form onSubmit={onSubmit}>
        <FormError error={error} />
        <Input
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
          series={series}
          seriesName="seriesId"
          onSeriesChange={selectSeries}
        />
        <div className={"ml-auto"}>
          <Button type={"submit"} isLoading={isSubmitting}>
            Send inn
          </Button>
        </div>
      </Form>
    </div>
  );
};
