"use client";
import { FormInput } from "@/components/FormField";
import { Series, VideoCreateRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Form } from "@heroui/react";
import { useVideosCreate } from "@/generated/videos/videos";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
import {
  nextEpisodeNumber,
  SeriesFields,
} from "@/app/organization/[organizationId]/create/SeriesFields";
import type { SeriesOption } from "@/app/organization/[organizationId]/create/SeriesFields";
import { NewSeriesModal } from "@/app/organization/[organizationId]/create/NewSeriesModal";
import { useState } from "react";
import { VideoFileDropzone } from "@/app/organization/[organizationId]/create/VideoFileDropzone";
import { stashUpload } from "@/app/organization/[organizationId]/create/pendingUploads";

/** A file name as a first guess at a title: no extension, separators as spaces. */
export const titleFromFileName = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * The first step of a new video: the file, and the little the API needs to
 * create it: a file and a title. The member then lands on the video's own page, where the file
 * goes up while the rest (description, picture, visibility, language, age
 * rating) is filled in on the same form used for every later edit.
 */
export const VideoCreateForm = ({
  organizationId,
  series,
}: {
  organizationId: number;
  series: Series[];
}) => {
  const { mutateAsync } = useVideosCreate();
  const router = useRouter();
  const form = useForm<VideoCreateRequest>({
    // Categories are optional and set later on the video's page, if at all.
    defaultValues: { organization: organizationId, categories: [] },
  });
  const { register, control } = form;
  const [availableSeries, setAvailableSeries] = useState<SeriesOption[]>(series);
  const [isSeriesModalOpen, setSeriesModalOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  const chooseFile = (file: File | null) => {
    setVideoFile(file);
    // Only a guess, and only where the member has not typed a title already.
    if (file && !form.getValues("name")) {
      const guess = titleFromFileName(file.name);
      form.setValue("name", guess, { shouldDirty: true });
      setTitle(guess);
    }
  };

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    if (!videoFile) throw new Error("Velg en videofil først.");
    const response = await mutateAsync({ data });
    const videoId = response.data.id;
    stashUpload(videoId, videoFile);
    router.push(`/video/${videoId}/edit`);
  });

  const selectSeries = (selected: SeriesOption | null) => {
    form.setValue("episodeNumber", nextEpisodeNumber(selected), {
      shouldDirty: true,
    });
  };

  const seriesCreated = (created: SeriesOption) => {
    setAvailableSeries((current) => [...current, created]);
    form.setValue("seriesId", created.id, { shouldDirty: true });
    form.setValue("episodeNumber", 1, { shouldDirty: true });
  };

  return (
    <>
      <Form onSubmit={onSubmit} className="block" autoComplete={"off"}>
        <div className="flex flex-col gap-5">
          <FormError error={error} />
          <VideoFileDropzone file={videoFile} onFileChange={chooseFile} isDisabled={isSubmitting} />
          <FormInput
            id="video-name"
            {...register("name")}
            value={title}
            onValueChange={setTitle}
            label={"Tittel"}
            labelPlacement={"outside-top"}
            isRequired
          />
          <SeriesFields
            control={control}
            series={availableSeries}
            seriesName="seriesId"
            onCreateSeries={() => setSeriesModalOpen(true)}
            onSeriesChange={selectSeries}
          />
          <div className="flex flex-wrap items-center justify-end gap-4">
            <p className="text-sm text-default-600">
              Beskrivelse, bilde og resten fyller dere inn mens filen lastes opp.
            </p>
            <Button type="submit" isPending={isSubmitting} variant="primary">
              Last opp og fortsett
            </Button>
          </div>
        </div>
      </Form>
      <NewSeriesModal
        organizationId={organizationId}
        isOpen={isSeriesModalOpen}
        onOpenChange={setSeriesModalOpen}
        onCreated={seriesCreated}
      />
    </>
  );
};
