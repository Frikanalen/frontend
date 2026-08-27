"use client";

import { FormError } from "@/components/form/FormError";
import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import { SeriesUpdateMutationBody, useSeriesPartialUpdate } from "@/generated/series/series";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { MDXEditorField } from "@/app/video/[videoId]/edit/MDXEditorField";
import { Button, Form, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type SeriesMetadataFields = Pick<SeriesUpdateMutationBody, "name" | "synopsis">;

export const SeriesEditForm = ({ series }: { series: Series }) => {
  const router = useRouter();
  const update = useSeriesPartialUpdate();
  const [saved, setSaved] = useState(false);
  const form = useForm<SeriesMetadataFields>({
    defaultValues: { name: series.name, synopsis: series.synopsis ?? "" },
  });
  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    setSaved(false);
    await update.mutateAsync({ id: series.id, data });
    setSaved(true);
    router.refresh();
  });

  return (
    <section className="space-y-4 rounded-large border border-default-200 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold">Seriedetaljer</h2>
        <p className="text-sm text-foreground-500">Endre navn og beskrivelse for serien.</p>
      </div>
      <Form onSubmit={onSubmit} className="block space-y-4">
        <FormError error={error} />
        {saved && (
          <p role="status" className="text-sm text-success-700">
            Serieopplysningene er lagret.
          </p>
        )}
        <Input
          {...form.register("name")}
          name="name"
          label="Navn"
          labelPlacement="outside-top"
          defaultValue={series.name}
          maxLength={255}
          isRequired
        />
        <MDXEditorField
          control={form.control}
          name="synopsis"
          label="Beskrivelse"
          rules={{
            maxLength: {
              value: 2048,
              message: "Beskrivelsen kan ikke være lengre enn 2048 tegn.",
            },
          }}
        />
        <div className="flex justify-end">
          <Button type="submit" color="primary" isLoading={isSubmitting}>
            Lagre
          </Button>
        </div>
      </Form>
    </section>
  );
};
