"use client";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { AffidavitSubmission } from "@/generated/frikanalenDjangoAPI.schemas";
import { useOrganizationAffidavitCreate } from "@/generated/organization/organization";
import { formatApiError } from "@/lib/formatApiError";
import { FormError } from "@/components/form/FormError";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "application/pdf,image/jpeg,image/png";

const when = (iso: string) =>
  new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Oslo",
  }).format(new Date(iso));

/** Where the latest scan stands, in a sentence or two. */
const Status = ({ latest }: { latest: AffidavitSubmission }) => {
  switch (latest.status) {
    case "pending":
      return (
        <p className="rounded-md bg-warning-50 p-4 text-warning-900">
          Erklæringen ble lastet opp {when(latest.submittedAt)} og venter på at Frikanalen sjekker
          den. Du får en e-post når den er godkjent.
        </p>
      );
    case "rejected":
      return (
        <div className="rounded-md bg-danger-50 p-4 text-danger-900">
          <p className="font-semibold">Frikanalen kunne ikke godkjenne erklæringen.</p>
          {latest.reviewNote && <p className="mt-1 whitespace-pre-line">{latest.reviewNote}</p>}
          <p className="mt-1">Rett det opp og last opp en ny skannet erklæring.</p>
        </div>
      );
    case "approved":
      return (
        <p className="rounded-md bg-success-50 p-4 text-success-900">Erklæringen er godkjent.</p>
      );
  }
};

/**
 * Upload the scanned, signed declaration for Frikanalen to check. Only the
 * editor signs it, so only the editor uploads it; members see how far it has
 * got.
 */
export const AffidavitUpload = ({
  organizationId,
  latest,
  isEditor,
}: {
  organizationId: number;
  latest: AffidavitSubmission | undefined;
  isEditor: boolean;
}) => {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useOrganizationAffidavitCreate();

  const choose = (chosen: File | undefined) => {
    setError(null);
    if (chosen && chosen.size > MAX_BYTES) {
      setError("Filen er for stor. Den kan være høyst 10 MB.");
      setFile(undefined);
      return;
    }
    setFile(chosen);
  };

  const send = async () => {
    if (!file) return;
    setError(null);
    try {
      await mutateAsync({ id: organizationId, data: { file } });
      setFile(undefined);
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (cause) {
      setError(formatApiError(cause));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {latest && <Status latest={latest} />}
      {isEditor ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1" htmlFor="affidavit-file">
            <span className="font-medium">
              {latest?.status === "pending"
                ? "Last opp en ny skannet erklæring"
                : "Skannet erklæring"}
            </span>
            <span className="text-sm text-default-600">
              PDF, JPEG eller PNG, høyst 10 MB. Et bilde tatt med mobilen holder, så lenge hele
              siden og signaturen er tydelige.
            </span>
          </label>
          <input
            ref={input}
            id="affidavit-file"
            type="file"
            accept={ACCEPT}
            className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-default-100 file:px-4 file:py-2 file:font-semibold"
            onChange={(event) => choose(event.target.files?.[0])}
          />
          <FormError error={error} />
          <div>
            <Button isDisabled={!file} isPending={isPending} onPress={send}>
              Send til Frikanalen
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-default-700">
          Det er redaktøren som signerer erklæringen og laster den opp.
        </p>
      )}
    </div>
  );
};
