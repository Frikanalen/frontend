"use client";
import { Category, Series, VideoCreateRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Form, Input, Textarea } from "@heroui/react";
import { Categories } from "@/app/organization/[organizationId]/create/Categories";
import { useVideosCreate, videosUploadTokenRetrieve } from "@/generated/videos/videos";
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
import { FileUpload } from "@/components/upload/FileUpload";
import { useState } from "react";
import { VideoFileDropzone } from "@/app/organization/[organizationId]/create/VideoFileDropzone";

type UploadJob = {
  videoId: string;
  uploadEndpoint: string;
  uploadToken: string;
  file: File;
};

export const VideoCreateForm = ({
  organizationId,
  organizationName,
  categories,
  series,
}: {
  organizationId: number;
  organizationName: string;
  categories: Category[];
  series: Series[];
}) => {
  const { mutateAsync } = useVideosCreate();
  const router = useRouter();
  const form = useForm<VideoCreateRequest>({ defaultValues: { organization: organizationId } });
  const { register, control } = form;
  const [availableSeries, setAvailableSeries] = useState<SeriesOption[]>(series);
  const [isSeriesModalOpen, setSeriesModalOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadJob, setUploadJob] = useState<UploadJob | null>(null);

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    if (!videoFile) throw new Error("Velg en videofil før du oppretter videoen.");
    const response = await mutateAsync({ data });
    const videoId = response.data.id.toString();

    try {
      const tokenResponse = await videosUploadTokenRetrieve(videoId);
      if (!tokenResponse.data.uploadToken) throw new Error("No upload token returned");
      setUploadJob({
        videoId,
        uploadEndpoint: tokenResponse.data.uploadUrl,
        uploadToken: tokenResponse.data.uploadToken,
        file: videoFile,
      });
    } catch {
      // The record already exists. Continue on the recovery page instead of
      // letting a retry create a duplicate video.
      router.push(`/video/${videoId}/upload`);
    }
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

  if (uploadJob) {
    return (
      <section className="space-y-4" aria-live="polite">
        <div className="prose dark:prose-invert">
          <h3>Videoen er opprettet. Laster opp {uploadJob.file.name}</h3>
          <p>La denne siden være åpen mens filen lastes opp og behandles.</p>
        </div>
        <FileUpload
          videoId={uploadJob.videoId}
          uploadEndpoint={uploadJob.uploadEndpoint}
          uploadToken={uploadJob.uploadToken}
          initialFile={uploadJob.file}
          autoStart
        />
      </section>
    );
  }

  return (
    <>
      <div className="prose mb-4 dark:prose-invert">
        <h2 className="mb-1!">Ny video</h2>
        <h3>for {organizationName}</h3>
        <p>
          Fyll inn videodetaljene og velg originalfilen. Videoen opprettes og lastes opp fra denne
          siden.
        </p>
      </div>
      <Form onSubmit={onSubmit} className="block" autoComplete={"off"}>
        <div className="flex flex-col gap-4">
          <FormError error={error} />
          <Input
            id="video-name"
            {...register("name")}
            placeholder={"Videotittel"}
            label={"Videotittel"}
            labelPlacement={"outside-top"}
            isRequired
          />
          <Textarea
            id="video-description"
            {...register("description")}
            classNames={{ input: "py-2" }} // heroui bug? margins very stingy
            placeholder={"Beskrivelse"}
            label={"Beskrivelse"}
            labelPlacement={"outside-top"}
            maxLength={255}
            isRequired
          />
          <Categories control={control} name={"categories"} categories={categories} />
          <SeriesFields
            control={control}
            series={availableSeries}
            seriesName="seriesId"
            onCreateSeries={() => setSeriesModalOpen(true)}
            onSeriesChange={selectSeries}
          />
          <VideoFileDropzone
            file={videoFile}
            onFileChange={setVideoFile}
            isDisabled={isSubmitting}
          />
          <div className="p-2 ml-auto">
            <Button type="submit" color="primary" isLoading={isSubmitting}>
              Opprett
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
