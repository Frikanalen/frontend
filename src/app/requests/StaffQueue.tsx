"use client";
import type { DecisionStatusEnum } from "@/generated/frikanalenDjangoAPI.schemas";
import {
  useGrantRequestsAirtimeDecisionCreate,
  useGrantRequestsExemptionDecisionCreate,
} from "@/generated/grant-requests/grant-requests";
import {
  useRecurringSlotRequestsCreationDecisionCreate,
  useRecurringSlotRequestsOwnershipDecisionCreate,
} from "@/generated/recurring-slot-requests/recurring-slot-requests";
import { formatApiError } from "@/lib/formatApiError";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import type { AnyRequest } from "./requests";
import { RequestSummary } from "./RequestSummary";
import { useRefreshRequests, useRequests } from "./useRequests";

const useDecide = () => {
  const airtime = useGrantRequestsAirtimeDecisionCreate();
  const exemption = useGrantRequestsExemptionDecisionCreate();
  const creation = useRecurringSlotRequestsCreationDecisionCreate();
  const ownership = useRecurringSlotRequestsOwnershipDecisionCreate();
  const mutations = { airtime, exemption, creation, ownership };
  return {
    decide: (request: AnyRequest, status: DecisionStatusEnum, adminComment: string) =>
      mutations[request.kind].mutateAsync({ id: request.id, data: { status, adminComment } }),
    isPending: Object.values(mutations).some((mutation) => mutation.isPending),
  };
};

/** What approving does, so staff know before they press. */
const APPROVAL = {
  airtime: "Godkjenning gir dem sendetiden.",
  exemption: "Godkjenning lar dem endre listen frem til sending.",
  creation: "Godkjenning lager sendeflaten fra i dag.",
  ownership: "Godkjenning gir dem sendeflaten. Sendetid som alt er delt ut, beholder eieren.",
};

const Decision = ({ request }: { request: AnyRequest }) => {
  const { decide, isPending } = useDecide();
  const refresh = useRefreshRequests();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string>();

  const submit = async (status: DecisionStatusEnum) => {
    setError(undefined);
    try {
      await decide(request, status, comment);
      await refresh();
    } catch (caught) {
      setError(formatApiError(caught));
    }
  };

  return (
    <div className="space-y-2 border-t border-separator pt-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Svar til organisasjonen
        <textarea
          className="min-h-16 rounded-lg border border-default-300 bg-background px-3 py-2"
          placeholder="Påkrevd, også ved godkjenning."
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </label>
      <p className="text-xs text-default-600">{APPROVAL[request.kind]}</p>
      {error ? (
        <p className="text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          isDisabled={!comment.trim()}
          isPending={isPending}
          size="sm"
          variant="primary"
          onPress={() => void submit("approved")}
        >
          Godkjenn
        </Button>
        <Button
          isDisabled={!comment.trim()}
          isPending={isPending}
          size="sm"
          variant="danger"
          onPress={() => void submit("denied")}
        >
          Avslå
        </Button>
        {request.kind === "creation" ? (
          <Link
            className="ms-auto self-center text-sm font-semibold text-link hover:underline"
            href="/schedule/plan/slots"
          >
            Se uken
          </Link>
        ) : null}
        {request.kind === "exemption" && request.grant ? (
          <Link
            className="ms-auto self-center text-sm font-semibold text-link hover:underline"
            href={`/organization/${request.organization}/schedule/${request.grant}`}
          >
            Se sendetiden
          </Link>
        ) : null}
      </div>
    </div>
  );
};

/**
 * Every organization's requests: the pending queue first, oldest first, each
 * with an answer box; what has been decided folded away below.
 */
export const StaffQueue = () => {
  const { requests, isLoading, error } = useRequests();
  const pending = requests.filter((request) => request.status === "pending");
  const decided = requests.filter((request) => request.status !== "pending");

  return (
    <div className="space-y-6">
      {isLoading ? <p>Laster forespørsler…</p> : null}
      {error ? <p role="alert">{formatApiError(error)}</p> : null}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Venter på svar ({pending.length})</h2>
        {!isLoading && pending.length === 0 ? (
          <p className="bg-background p-5">Ingen forespørsler venter.</p>
        ) : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {pending.map((request) => (
            <RequestSummary
              key={`${request.kind}-${request.id}`}
              request={request}
              showOrganization
            >
              <Decision request={request} />
            </RequestSummary>
          ))}
        </div>
      </section>
      {decided.length > 0 ? (
        <details className="space-y-3">
          <summary className="cursor-pointer text-xl font-bold">Avgjort ({decided.length})</summary>
          <div className="mt-3 grid gap-3 opacity-90 lg:grid-cols-2">
            {decided.map((request) => (
              <RequestSummary
                key={`${request.kind}-${request.id}`}
                request={request}
                showOrganization
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
};
