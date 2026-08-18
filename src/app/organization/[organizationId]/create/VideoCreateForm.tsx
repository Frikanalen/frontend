"use client";
import { Category, VideoCreateRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Form, Input, Textarea } from "@heroui/react";
import { Categories } from "@/app/organization/[organizationId]/create/Categories";
import { useVideosCreate } from "@/generated/videos/videos";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
export const VideoCreateForm = ({
  organizationId,
  categories,
}: {
  organizationId: number;
  categories: Category[];
}) => {
  const { mutateAsync } = useVideosCreate();
  const router = useRouter();
  const form = useForm<VideoCreateRequest>({ defaultValues: { organization: organizationId } });
  const { register, control } = form;

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    const response = await mutateAsync({ data });
    router.push(`/video/${response.data.id}/upload`);
  });

  return (
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
        <div className="p-2 ml-auto">
          <Button type="submit" isLoading={isSubmitting}>
            Lag video
          </Button>
        </div>
      </div>
    </Form>
  );
};
