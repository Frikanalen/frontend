"use client";
import { useForm } from "react-hook-form";
import { OrganizationRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { Button, Form, Input, Textarea } from "@heroui/react";
import { useOrganizationCreate } from "@/generated/organization/organization";
import { useRouter } from "next/navigation";

export const OrgCreateForm = () => {
  const { register, handleSubmit } = useForm<OrganizationRequest>();
  const router = useRouter();
  const { mutateAsync } = useOrganizationCreate();
  return (
    <div>
      <Form
        onSubmit={handleSubmit(async (data) => {
          const { data: org } = await mutateAsync({ data });
          router.push(`/organization/${org.id}`);
        })}
      >
        <Input
          label={"Organisasjonens navn"}
          labelPlacement={"outside-top"}
          {...register("name")}
        />
        <Input
          label={"Organisasjonens nettside"}
          labelPlacement={"outside-top"}
          {...register("homepage")}
        />
        <Textarea
          label={"En kort beskrivelse av organisasjonen"}
          labelPlacement={"outside-top"}
          {...register("description")}
        />
        <Button type={"submit"}>Opprett organisasjon</Button>
      </Form>
    </div>
  );
};
