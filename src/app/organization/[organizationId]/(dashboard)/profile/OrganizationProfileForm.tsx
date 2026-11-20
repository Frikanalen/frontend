"use client";
import { Button, Form } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { GoCheck } from "react-icons/go";
import { FormInput, FormTextArea } from "@/components/FormField";
import { FormError } from "@/components/form/FormError";
import type {
  Organization,
  PatchedOrganizationRequest,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { useOrganizationPartialUpdate } from "@/generated/organization/organization";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

/** The model's limit on the description. */
export const DESCRIPTION_MAX = 255;

type Fields = Required<
  Pick<
    PatchedOrganizationRequest,
    "name" | "description" | "homepage" | "postalAddress" | "streetAddress"
  >
>;

const fieldsOf = (organization: Organization): Fields => ({
  name: organization.name,
  description: organization.description ?? "",
  homepage: organization.homepage ?? "",
  postalAddress: organization.postalAddress ?? "",
  streetAddress: organization.streetAddress ?? "",
});

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <dt className="text-sm font-medium">{label}</dt>
    <dd className="mt-0.5 break-words whitespace-pre-line text-default-700">
      {children || <span className="text-default-500">Ikke oppgitt</span>}
    </dd>
  </div>
);

/**
 * The organization's public profile: its name, what it says about itself,
 * where to find it, and its editor. The editor's name and e-mail come from
 * the editor's own account, so they are shown here but changed there; a new
 * editor goes through Frikanalen, because they must sign the declaration.
 */
export const OrganizationProfileForm = ({
  organization,
  mayEdit,
}: {
  organization: Organization;
  mayEdit: boolean;
}) => {
  const router = useRouter();
  const { mutateAsync } = useOrganizationPartialUpdate();
  const form = useForm<Fields>({ defaultValues: fieldsOf(organization) });
  const { register, control, formState, reset } = form;
  const [saved, setSaved] = useState(false);
  // Controlled fields: React Aria keeps its own copy otherwise, and reset()
  // after saving would not reach it.
  const values = useWatch({ control });

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    setSaved(false);
    const { data: updated } = await mutateAsync({ id: organization.id, data });
    reset(fieldsOf(updated));
    setSaved(true);
    // The studio bar carries the name.
    router.refresh();
  });
  useUnsavedChangesWarning(
    formState.isDirty,
    "Du har endringer som ikke er lagret. Vil du forlate siden?",
  );

  const editor = (
    <section
      aria-labelledby="editor-heading"
      className="space-y-3 border-t border-default-200 pt-5"
    >
      <h2 id="editor-heading" className="text-lg font-bold">
        Redaktør
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Fact label="Navn">{organization.editorName?.trim()}</Fact>
        <Fact label="E-post">{organization.editorEmail?.trim()}</Fact>
      </dl>
      <p className="text-sm text-default-600">
        Navn og e-post hentes fra redaktørens egen{" "}
        <Link className="text-link hover:underline" href="/profile/edit">
          profil
        </Link>
        . Skal organisasjonen få en ny redaktør, må den nye redaktøren signere erklæringen:{" "}
        <Link className="text-link hover:underline" href="/about/contact">
          ta kontakt med Frikanalen
        </Link>
        .
      </p>
    </section>
  );

  if (!mayEdit) {
    const fields = fieldsOf(organization);
    return (
      <div className="max-w-3xl space-y-6">
        <p className="border-l-4 border-default-300 bg-content1 p-3 text-sm" role="note">
          Bare redaktøren, {organization.editorName?.trim() || "som Frikanalen har registrert"}, kan
          endre profilen.
        </p>
        <dl className="grid gap-4">
          <Fact label="Navn">{fields.name}</Fact>
          <Fact label="Om organisasjonen">{fields.description}</Fact>
          <Fact label="Nettside">{fields.homepage}</Fact>
          <div className="grid gap-4 sm:grid-cols-2">
            <Fact label="Besøksadresse">{fields.streetAddress}</Fact>
            <Fact label="Postadresse">{fields.postalAddress}</Fact>
          </div>
          <Fact label="Organisasjonsnummer">{organization.orgnr}</Fact>
        </dl>
        {editor}
      </div>
    );
  }

  return (
    <Form className="flex max-w-3xl flex-col gap-5" onSubmit={onSubmit}>
      <FormError error={error} />
      <FormInput
        label="Navn"
        id="org-name"
        isRequired
        {...register("name", { required: "Organisasjonen må ha et navn." })}
        value={values.name ?? ""}
        isInvalid={!!formState.errors.name}
        errorMessage={formState.errors.name?.message}
      />
      <FormTextArea
        label="Om organisasjonen"
        id="org-description"
        rows={4}
        classNames={{ input: "py-2" }}
        {...register("description", {
          maxLength: {
            value: DESCRIPTION_MAX,
            message: `Høyst ${DESCRIPTION_MAX} tegn. Kort ned teksten.`,
          },
        })}
        value={values.description ?? ""}
        description={`Vises øverst på den offentlige siden. ${(values.description ?? "").length} av ${DESCRIPTION_MAX} tegn.`}
        isInvalid={!!formState.errors.description}
        errorMessage={formState.errors.description?.message}
      />
      <FormInput
        label="Nettside"
        id="org-homepage"
        type="url"
        {...register("homepage")}
        value={values.homepage ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormTextArea
          label="Besøksadresse"
          id="org-streetAddress"
          rows={3}
          classNames={{ input: "w-full py-2" }}
          {...register("streetAddress")}
          value={values.streetAddress ?? ""}
        />
        <FormTextArea
          label="Postadresse"
          id="org-postalAddress"
          rows={3}
          classNames={{ input: "w-full py-2" }}
          {...register("postalAddress")}
          value={values.postalAddress ?? ""}
        />
      </div>
      <p className="text-sm text-default-600">
        Organisasjonsnummer {organization.orgnr || "ikke oppgitt"}. Ta kontakt med Frikanalen om det
        er feil.
      </p>
      <div className="flex items-center justify-end gap-3">
        {saved && !formState.isDirty && (
          <p role="status" className="inline-flex items-center gap-1 text-sm text-success-700">
            <GoCheck aria-hidden="true" />
            Lagret
          </p>
        )}
        <Button type="submit" isPending={isSubmitting} isDisabled={!formState.isDirty}>
          Lagre
        </Button>
      </div>
      {editor}
    </Form>
  );
};
