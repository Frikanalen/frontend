"use client";
import { FormInput } from "@/components/FormField";
import { useOrganizationLiveSourcesCreate } from "@/generated/organization/organization";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PULL_URL_HELP } from "./PullAddress";

/**
 * A new live source: one per place you send from, such as a studio. With an
 * address, Frikanalen pulls the signal from it instead of an encoder pushing.
 */
export const NewLiveSource = ({ organizationId }: { organizationId: number }) => {
  const router = useRouter();
  const create = useOrganizationLiveSourcesCreate();
  const [name, setName] = useState("");
  const [pullUrl, setPullUrl] = useState("");

  return (
    <form
      aria-label="Ny direktekilde"
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        create
          .mutateAsync({
            id: organizationId,
            data: { name: name.trim(), ...(pullUrl.trim() ? { pullUrl: pullUrl.trim() } : {}) },
          })
          .then(() => {
            setName("");
            setPullUrl("");
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
      <div className="min-w-64 grow">
        <FormInput
          description={`Bare hvis Frikanalen skal hente signalet selv, i stedet for at en koder sender det. ${PULL_URL_HELP}`}
          label="Henteadresse (valgfritt)"
          value={pullUrl}
          onValueChange={setPullUrl}
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
