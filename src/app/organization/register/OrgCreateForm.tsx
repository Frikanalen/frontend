"use client";
import { FormInput, FormTextArea } from "@/components/FormField";
import { useForm, useWatch } from "react-hook-form";
import { OrganizationRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Form } from "@heroui/react";
import { useOrganizationCreate } from "@/generated/organization/organization";
import { useRouter } from "next/navigation";
import cx from "classnames";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
import { isValidOrgnr, normalizeOrgnr } from "@/lib/orgnr";
import { BrregLookup, useBrregLookup } from "@/app/organization/register/useBrregLookup";

// The fields the register fills in.
const PREFILLED = ["name", "homepage", "streetAddress", "postalAddress"] as const;

const LookupStatus = ({ lookup }: { lookup: BrregLookup }) => {
  switch (lookup.state) {
    case "idle":
      return null;
    case "invalid":
      return (
        <p className="text-sm text-danger">
          Nummeret stemmer ikke. Sjekk at du har skrevet det riktig.
        </p>
      );
    case "loading":
      return <p className="text-sm text-default-600">Henter fra Brønnøysundregistrene …</p>;
    case "not-found":
      return (
        <p className="text-sm text-danger">
          Fant ingen organisasjon med dette nummeret i Enhetsregisteret.
        </p>
      );
    case "deleted":
      return <p className="text-sm text-danger">Organisasjonen er slettet fra Enhetsregisteret.</p>;
    case "unavailable":
      return (
        <p className="text-sm text-default-600">
          Fikk ikke svar fra Brønnøysundregistrene. Fyll inn feltene under selv.
        </p>
      );
    case "found": {
      const { entity } = lookup;
      return (
        <div className="text-sm text-default-700">
          <p>
            Hentet fra Enhetsregisteret: <strong>{entity.name}</strong>
            {entity.organizationForm && <> ({entity.organizationForm.toLowerCase()})</>}. Se over
            feltene under og rett det som ikke stemmer.
          </p>
          {entity.bankrupt && (
            <p className="mt-1 text-danger">Registeret oppgir at organisasjonen er konkurs.</p>
          )}
          {entity.beingDissolved && (
            <p className="mt-1 text-danger">
              Registeret oppgir at organisasjonen er under avvikling.
            </p>
          )}
        </div>
      );
    }
  }
};

export const OrgCreateForm = ({ className }: { className?: string }) => {
  const form = useForm<OrganizationRequest>();
  const { register } = form;
  // Controlled, so what the register fills in shows up in the fields.
  const [name, homepage, streetAddress, postalAddress] = useWatch({
    control: form.control,
    name: [...PREFILLED],
  });
  const { lookup, canFetch, fetch } = useBrregLookup(
    useWatch({ control: form.control, name: "orgnr" }),
    (entity) => {
      // Asked for with the button, so it replaces what is there.
      for (const field of PREFILLED) {
        form.setValue(field, entity[field], { shouldDirty: true });
      }
    },
  );
  const router = useRouter();
  const { mutateAsync } = useOrganizationCreate();

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    const { data: org } = await mutateAsync({ data });
    // On to the rest of the road, not to a public page that is not public yet.
    router.push(`/organization/${org.id}/start`);
    router.refresh();
  });

  return (
    <Form onSubmit={onSubmit} className={cx("block", className)} autoComplete={"off"}>
      <div className="flex flex-col gap-4">
        <FormError error={error} />
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <FormInput
              label={"Organisasjonsnummer"}
              labelPlacement={"outside-top"}
              description={
                "Fra Brønnøysundregistrene. Hent opplysningene derfra, eller la feltet stå tomt hvis organisasjonen ikke har et."
              }
              inputMode={"numeric"}
              autoComplete={"off"}
              id="org-orgnr"
              className="w-full sm:max-w-xs"
              isInvalid={!!form.formState.errors.orgnr}
              errorMessage={form.formState.errors.orgnr?.message}
              {...register("orgnr", {
                setValueAs: (value: string) => normalizeOrgnr(value ?? ""),
                validate: (value) =>
                  !value || isValidOrgnr(value) || "Organisasjonsnummeret er ikke gyldig.",
              })}
            />
            <Button
              variant="secondary"
              isDisabled={!canFetch}
              isPending={lookup.state === "loading"}
              onPress={fetch}
            >
              Hent fra Brønnøysund
            </Button>
          </div>
          <LookupStatus lookup={lookup} />
        </div>
        <FormInput
          label={"Organisasjonens navn"}
          labelPlacement={"outside-top"}
          isRequired
          id="org-name"
          {...register("name")}
          value={name ?? ""}
        />
        <FormInput
          label={"Organisasjonens nettside"}
          labelPlacement={"outside-top"}
          type={"url"}
          id="org-homepage"
          {...register("homepage")}
          value={homepage ?? ""}
        />
        <FormTextArea
          label={"En kort beskrivelse av organisasjonen"}
          labelPlacement={"outside-top"}
          classNames={{ input: "py-2" }} // heroui bug? margins very stingy
          id="org-description"
          {...register("description")}
          isRequired
        />
        <div className="flex flex-col gap-4 sm:flex-row">
          <FormTextArea
            label={"Besøksadresse"}
            labelPlacement={"outside-top"}
            isRequired
            id="org-streetAddress"
            {...register("streetAddress")}
            value={streetAddress ?? ""}
            classNames={{ input: "py-2" }} // heroui bug? margins very stingy
          />
          <FormTextArea
            label={"Postadresse"}
            labelPlacement={"outside-top"}
            isRequired
            id="org-postalAddress"
            {...register("postalAddress")}
            value={postalAddress ?? ""}
            classNames={{ input: "py-2" }} // heroui bug? margins very stingy
          />
        </div>
        <div className="ml-auto">
          <Button type={"submit"} isPending={isSubmitting}>
            Opprett organisasjon
          </Button>
        </div>
      </div>
    </Form>
  );
};
