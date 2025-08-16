"use client";
import { Category, VideoCreateRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Input, Textarea } from "@heroui/react";
import { Categories } from "@/app/organization/[organizationId]/create/Categories";
import { useVideosCreate } from "@/generated/videos/videos";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

export const VideoCreateForm = ({
  organizationId,
  categories,
}: {
  organizationId: number;
  categories: Category[];
}) => {
  const { mutateAsync } = useVideosCreate();
  const router = useRouter();
  const { register, handleSubmit, control } = useForm<VideoCreateRequest>();
  return (
    <form
      onSubmit={handleSubmit((data) =>
        mutateAsync({ data }).then((response) => router.push(`/video/${response.data.id}/upload`)),
      )}
    >
      <div className="flex flex-col gap-4">
        <Input
          {...register("name")}
          placeholder={"videotittel"}
          label={"Videotittel"}
          labelPlacement={"outside-left"}
          autoComplete={"off"}
          required
        />
        <Input
          {...register("header")}
          placeholder={"En kort undertittel (Valgfritt)"}
          label={"Undertittel"}
          autoComplete={"off"}
        />
        <Textarea
          {...register("description")}
          placeholder={"Beskrivelse"}
          label={"Beskrivelse"}
          required
        />
        <input type={"hidden"} {...register("organization")} value={organizationId} />
        <Categories control={control} name={"categories"} categories={categories} />
        <Button type="submit" />
      </div>
    </form>
  );
};
