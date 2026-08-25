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
  Textarea,
} from "@heroui/react";
import { useForm } from "react-hook-form";
import type { SeriesOption } from "@/app/organization/[organizationId]/create/SeriesFields";

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
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      isDismissable={!isSubmitting}
      hideCloseButton={isSubmitting}
    >
      <ModalContent>
        <Form onSubmit={onSubmit} className="w-full">
          <ModalHeader>Opprett ny serie</ModalHeader>
          <ModalBody className="w-full gap-4">
            <p className="text-sm text-foreground-500">
              Serien velges automatisk for videoen når den er opprettet.
            </p>
            <FormError error={error} />
            <Input
              label="Serienavn"
              labelPlacement="outside-top"
              isRequired
              {...form.register("name")}
            />
            <Textarea
              label="Beskrivelse (valgfritt)"
              labelPlacement="outside-top"
              maxLength={2048}
              {...form.register("synopsis")}
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
