"use client";
import { FormInput } from "@/components/FormField";
import { SeriesWriteRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { useSeriesCreate } from "@/generated/series/series";
import { FormError } from "@/components/form/FormError";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { Button, Form, Modal } from "@heroui/react";
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
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop isDismissable={!isSubmitting}>
        <Modal.Container
            size="lg"
          scroll="inside"
          className="m-0 h-[100dvh] max-h-[100dvh] max-w-full rounded-none sm:m-6 sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-3xl sm:rounded-large"
        >
          <Modal.Dialog>
            <Form onSubmit={onSubmit} className="flex h-full min-h-0 w-full flex-col">
              <Modal.Header className="px-4 sm:px-6">
                <Modal.Heading>Opprett ny serie</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="w-full min-w-0 gap-4 px-4 sm:px-6">
                <p className="text-sm text-foreground-500">
                  Oppgi et navn og eventuelt en kort beskrivelse av serien.
                </p>
                <FormError error={error} />
                <FormInput
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
              </Modal.Body>
              <Modal.Footer className="w-full px-4 sm:px-6">
                <Button
                  type="button"
                  variant="tertiary"
                  isDisabled={isSubmitting}
                  onPress={() => handleOpenChange(false)}
                >
                  Avbryt
                </Button>
                <Button type="submit" isPending={isSubmitting} variant="primary">
                  Opprett serie
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
