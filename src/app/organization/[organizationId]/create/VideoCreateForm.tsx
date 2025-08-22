"use client";
import { Category, VideoCreateRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Input, Textarea } from "@heroui/react";
import { Categories } from "@/app/organization/[organizationId]/create/Categories";
import { useVideosCreate } from "@/generated/videos/videos";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import cx from "classnames";
export const VideoCreateForm = ({
  organizationId,
  categories,
  className,
}: {
  organizationId: number;
  categories: Category[];
  className?: string;
}) => {
  const { mutateAsync } = useVideosCreate();
  const router = useRouter();
  const { register, handleSubmit, control } = useForm<VideoCreateRequest>();
  return (
    <form
      onSubmit={handleSubmit((data) =>
        mutateAsync({ data }).then((response) => router.push(`/video/${response.data.id}/upload`)),
      )}
      className={cx("block", className)}
      autoComplete={"off"}
    >
      <div className="flex flex-col gap-4">
        <Input
          {...register("name")}
          placeholder={"Videotittel"}
          label={"Videotittel"}
          labelPlacement={"outside-top"}
          isRequired
        />
        <Textarea
          {...register("description")}
          classNames={{ input: "py-2" }} // heroui bug? margins very stingy
          placeholder={"Beskrivelse"}
          label={"Beskrivelse"}
          labelPlacement={"outside-top"}
          maxLength={255}
          isRequired
        />
        <input type={"hidden"} {...register("organization")} value={organizationId} />
        <Categories control={control} name={"categories"} categories={categories} />
        <div className="p-2 ml-auto">
          <Button type="submit">Lag video</Button>
        </div>
      </div>
    </form>
  );
};
