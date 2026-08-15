"use client";
import { useForm } from "react-hook-form";
import { PatchedVideoRequest, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useRouter } from "next/navigation";
import { Button, Form, Input } from "@heroui/react";

import { MDXEditorField } from "@/app/video/[videoId]/edit/MDXEditorField";
import { editAction } from "@/app/video/[videoId]/edit/editAction";
import { videosPartialUpdate } from "@/generated/videos/videos";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";

export const VideoEditForm = ({ video }: { video: Video }) => {
  const form = useForm<PatchedVideoRequest>({
    defaultValues: { name: video.name, header: video.header, description: video.description },
  });
  const { register, control } = form;
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
        <Input label={"Navn"} labelPlacement={"outside-top"} {...register("name")} />
        <MDXEditorField
          className={"w-full"}
          label={"Beskrivelse"}
          control={control}
          name={"description"}
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
