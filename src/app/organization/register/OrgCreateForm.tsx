"use client";
import { useForm } from "react-hook-form";
import { OrganizationRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Form, Input, Textarea } from "@heroui/react";
import { useOrganizationCreate } from "@/generated/organization/organization";
import { useRouter } from "next/navigation";
import cx from "classnames";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";
export const OrgCreateForm = ({ className }: { className?: string }) => {
  const form = useForm<OrganizationRequest>();
  const { register } = form;
  const router = useRouter();
  const { mutateAsync } = useOrganizationCreate();

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    const { data: org } = await mutateAsync({ data });
    router.push(`/organization/${org.id}`);
  });

  return (
    <Form onSubmit={onSubmit} className={cx("block", className)} autoComplete={"off"}>
      <div className="flex flex-col gap-4">
        <FormError error={error} />
        <Input
          label={"Organisasjonens navn"}
          labelPlacement={"outside-top"}
          isRequired
          {...register("name")}
        />
        <Input
          label={"Organisasjonens nettside"}
          labelPlacement={"outside-top"}
          type={"url"}
          {...register("homepage")}
        />
        <Textarea
          label={"En kort beskrivelse av organisasjonen"}
          labelPlacement={"outside-top"}
          classNames={{ input: "py-2" }} // heroui bug? margins very stingy
          {...register("description")}
          isRequired
        />
        <div className="flex gap-4">
          <Textarea
            label={"Besøksadresse"}
            labelPlacement={"outside-top"}
            isRequired
            {...register("streetAddress")}
            classNames={{ input: "py-2" }} // heroui bug? margins very stingy
          />
          <Textarea
            label={"Postadresse"}
            labelPlacement={"outside-top"}
            isRequired
            {...register("postalAddress")}
            classNames={{ input: "py-2" }} // heroui bug? margins very stingy
          />
        </div>
        <div className="ml-auto">
          <Button type={"submit"} isLoading={isSubmitting}>
            Opprett organisasjon
          </Button>
        </div>
      </div>
    </Form>
  );
};
