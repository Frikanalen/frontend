"use client";
import { useForm, useWatch } from "react-hook-form";
import { PatchedVideoRequest, Series, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useRouter } from "next/navigation";
import { Button, Form, Input } from "@heroui/react";

import { MDXEditorField } from "@/app/video/[videoId]/edit/MDXEditorField";
import { editAction } from "@/app/video/[videoId]/edit/editAction";
import { videosPartialUpdate } from "@/generated/videos/videos";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
import { SeriesFields } from "@/app/organization/[organizationId]/create/SeriesFields";

export const VideoEditForm = ({ video, series }: { video: Video; series: Series[] }) => {
  const form = useForm<PatchedVideoRequest>({
    defaultValues: {
      name: video.name,
      header: video.header,
      description: video.description,
      seriesId: video.series?.id ?? null,
      episodeNumber: video.episodeNumber,
    },
  });
  const { register, control } = form;
  const selectedSeries = useWatch({ control, name: "seriesId" });
  const router = useRouter();

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
          register={register}
          series={series}
          seriesName="seriesId"
          episodeName="episodeNumber"
          selectedSeries={selectedSeries}
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
