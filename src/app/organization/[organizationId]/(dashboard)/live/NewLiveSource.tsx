"use client";
import { FormInput } from "@/components/FormField";
import { useOrganizationLiveSourcesCreate } from "@/generated/organization/organization";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** A new live source: one per place you send from, such as a studio. */
export const NewLiveSource = ({ organizationId }: { organizationId: number }) => {
  const router = useRouter();
  const create = useOrganizationLiveSourcesCreate();
  const [name, setName] = useState("");

  return (
    <form
      aria-label="Ny direktekilde"
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        create
          .mutateAsync({ id: organizationId, data: { name: name.trim() } })
          .then(() => {
            setName("");
            router.refresh();
          })
          .catch(() => undefined);
      }}
    >
      <div className="min-w-48 grow">
        <FormInput
          description="Ett navn per sted dere sender fra, f.eks. «Studio»."
          label="Ny direktekilde"
          value={name}
          onValueChange={setName}
        />
      </div>
      <Button isDisabled={!name.trim() || create.isPending} type="submit">
        Opprett kilde
      </Button>
      {create.isError ? (
        <p className="w-full" role="alert">
          {formatApiError(create.error)}
        </p>
      ) : null}
    </form>
  );
};
