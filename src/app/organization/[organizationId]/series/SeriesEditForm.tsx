"use client";

import { FormError } from "@/components/form/FormError";
import { Series } from "@/generated/frikanalenDjangoAPI.schemas";
import type {
  SeriesMetadataAction,
  SeriesMetadataState,
} from "@/app/organization/[organizationId]/series/seriesMetadata";
import { Button, Input, Textarea } from "@heroui/react";
import { useActionState } from "react";

const initialState: SeriesMetadataState = { status: "idle", message: "" };

export const SeriesEditForm = ({
  series,
  updateAction,
}: {
  series: Series;
  updateAction: SeriesMetadataAction;
}) => {
  const [state, formAction, isPending] = useActionState(updateAction, initialState);

  return (
    <section className="space-y-4 rounded-large border border-default-200 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-bold">Seriedetaljer</h2>
        <p className="text-sm text-foreground-500">Endre navn og beskrivelse for serien.</p>
      </div>
      <form action={formAction} className="space-y-4">
        <FormError error={state.status === "error" ? state.message : null} />
        {state.status === "success" && (
          <p role="status" className="text-sm text-success-700">
            {state.message}
          </p>
        )}
        <Input
          name="name"
          label="Navn"
          labelPlacement="outside-top"
          defaultValue={series.name}
          maxLength={255}
          isRequired
        />
        <Textarea
          name="synopsis"
          label="Beskrivelse"
          labelPlacement="outside-top"
          defaultValue={series.synopsis ?? ""}
          maxLength={2048}
        />
        <div className="flex justify-end">
          <Button type="submit" color="primary" isLoading={isPending}>
            Lagre
          </Button>
        </div>
      </form>
    </section>
  );
};
