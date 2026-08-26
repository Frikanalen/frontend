"use client";

import { SeriesWriteRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { useSeriesCreate } from "@/generated/series/series";
import { FormError } from "@/components/form/FormError";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useForm } from "react-hook-form";
import type { SeriesOption } from "@/app/organization/[organizationId]/create/SeriesFields";
import { MDXEditorField } from "@/app/video/[videoId]/edit/MDXEditorField";

const emptyValues = (organization: number): SeriesWriteRequest => ({
  name: "",
  synopsis: "",
  organization,
});

export const NewSeriesModal = ({
  organizationId,
  isOpen,
  onOpenChange,
  onCreated,
}: {
  organizationId: number;
  isOpen: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  onCreated: (_series: SeriesOption) => void;
}) => {
  const create = useSeriesCreate();
  const form = useForm<SeriesWriteRequest>({ defaultValues: emptyValues(organizationId) });
  const { onSubmit, error, isSubmitting, clearError } = useApiFormSubmit(form, async (data) => {
    const response = await create.mutateAsync({ data });
    onCreated(response.data);
    form.reset(emptyValues(organizationId));
    onOpenChange(false);
  });

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      clearError();
      form.reset(emptyValues(organizationId));
    }
    onOpenChange(open);
  };

  return (
    <Modal
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "m-0 h-[100dvh] max-h-[100dvh] max-w-full rounded-none sm:m-6 sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-3xl sm:rounded-large",
        header: "px-4 sm:px-6",
        body: "min-w-0 px-4 sm:px-6",
        footer: "px-4 sm:px-6",
      }}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      isDismissable={!isSubmitting}
      hideCloseButton={isSubmitting}
    >
      <ModalContent>
        <Form onSubmit={onSubmit} className="flex h-full min-h-0 w-full flex-col">
          <ModalHeader>Opprett ny serie</ModalHeader>
          <ModalBody className="w-full gap-4">
            <p className="text-sm text-foreground-500">
              Oppgi et navn og eventuelt en kort beskrivelse av serien.
            </p>
            <FormError error={error} />
            <Input
              label="Serienavn"
              labelPlacement="outside-top"
              isRequired
              {...form.register("name")}
            />
            <MDXEditorField
              className="min-w-0 w-full"
              control={form.control}
              name="synopsis"
              label="Beskrivelse (valgfritt)"
              placeholder="Beskrivelse"
              rules={{
                maxLength: {
                  value: 2048,
                  message: "Beskrivelsen kan ikke være lengre enn 2048 tegn.",
                },
              }}
            />
          </ModalBody>
          <ModalFooter className="w-full">
            <Button
              type="button"
              variant="light"
              isDisabled={isSubmitting}
              onPress={() => handleOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" color="primary" isLoading={isSubmitting}>
              Opprett serie
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
