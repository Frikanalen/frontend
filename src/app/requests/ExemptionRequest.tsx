"use client";
import type { AirtimeGrant } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantRequestsExemptionCreate } from "@/generated/grant-requests/grant-requests";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import { useState } from "react";
import { useRefreshRequests, useRequests } from "./useRequests";

/**
 * Under a grant whose deadline has passed: ask Frikanalen to open it again.
 * Approval makes it editable until air. Shows where an earlier request
 * stands, so nobody asks twice.
 */
export const ExemptionRequest = ({ grant }: { grant: AirtimeGrant }) => {
  const { requests } = useRequests({ organization: grant.organization.id });
  const create = useGrantRequestsExemptionCreate();
  const refresh = useRefreshRequests();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const latest = requests.find(
    (request) => request.kind === "exemption" && request.grant === grant.id,
  );

  if (latest?.status === "pending") {
    return (
      <p className="bg-background p-3 text-sm" role="status">
        Dere har bedt om å få endre listen. Forespørselen venter på svar fra Frikanalen.
      </p>
    );
  }

  const submit = async () => {
    setError(undefined);
    try {
      await create.mutateAsync({ data: { grant: grant.id, message } });
      setMessage("");
      await refresh();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <form
      className="space-y-2 bg-background p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {latest?.status === "denied" ? (
        <p className="text-sm">
          Frikanalen avslo forrige forespørsel
          {latest.adminComment ? `: «${latest.adminComment}»` : "."}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Må listen endres likevel? Fortell Frikanalen hvorfor.
        <textarea
          className="min-h-20 rounded-lg border border-default-300 bg-background px-3 py-2"
          placeholder="For eksempel: gjesten kunne ikke komme, vi sender opptaket i stedet."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      {error ? (
        <p className="text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button isPending={create.isPending} size="sm" type="submit" variant="secondary">
        Be om å få endre listen
      </Button>
    </form>
  );
};
