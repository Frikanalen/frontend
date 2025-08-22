"use client";
import { useForm } from "react-hook-form";
import { PatchedVideoRequest, Video } from "@/generated/frikanalenDjangoAPI.schemas";
import { useRouter } from "next/navigation";
import { Button, Form, Input } from "@heroui/react";

import { MDXEditorField } from "@/app/video/[videoId]/edit/MDXEditorField";
import { editAction } from "@/app/video/[videoId]/edit/editAction";
import { videosPartialUpdate } from "@/generated/videos/videos";

export const VideoEditForm = ({ video }: { video: Video }) => {
  const { register, handleSubmit, control } = useForm<PatchedVideoRequest>({
    defaultValues: { name: video.name, header: video.header, description: video.description },
  });
  const router = useRouter();

  return (
    <div>
      <Form
        onSubmit={handleSubmit(async (payload) => {
          const update = await videosPartialUpdate(video.id.toString(), payload);
          if (update.status !== 200)
            throw new Error(`Failed to update video ${video.id} with status ${update.status}`);
          await editAction(video.id);
          router.push(`/video/${video.id}`);
        })}
      >
        <Input label={"Navn"} labelPlacement={"outside-top"} {...register("name")} />
        <MDXEditorField
          className={"w-full"}
          label={"Beskrivelse"}
          control={control}
          name={"description"}
        />
        <div className={"ml-auto"}>
          <Button type={"submit"}>Send inn</Button>
        </div>
      </Form>
    </div>
  );
};
