"use client";
import { SlotPlanner } from "@/app/schedule/plan/slots/SlotPlanner";
import type { Shape } from "@/app/schedule/plan/slots/slots";
import { formatApiError } from "@/lib/formatApiError";
import { useState } from "react";
import { AirtimeRequestForm } from "./AirtimeRequestForm";
import { RequestSummary } from "./RequestSummary";
import { useRequests } from "./useRequests";

/**
 * A member's way to ask for airtime: the week as it is taken now, a form
 * beside it, and the organization's requests with Frikanalen's answers.
 */
export const RequestPage = ({
  organizationId,
  blocked,
  initialKind,
}: {
  initialKind?: "weekly" | "once";
  organizationId: number;
  /** Why the organization can't ask now; the form is left out. */
  blocked: string | null;
}) => {
  const [shape, setShape] = useState<Shape | null>(null);
  const { requests, isLoading, error } = useRequests({ organization: organizationId });

  return (
    <div className="space-y-8">
      <SlotPlanner
        organizations={[]}
        pick={{
          selection: blocked ? null : shape,
          onSelect: (picked) => (blocked ? undefined : setShape(picked)),
          side: blocked ? (
            <p className="border-l-4 border-warning bg-background p-5" role="note">
              {blocked}
            </p>
          ) : (
            <AirtimeRequestForm
              initialKind={initialKind}
              organizationId={organizationId}
              shape={shape}
              onShapeChange={setShape}
            />
          ),
        }}
      />

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Våre forespørsler</h2>
        {isLoading ? <p>Laster forespørsler…</p> : null}
        {error ? <p role="alert">{formatApiError(error)}</p> : null}
        {!isLoading && requests.length === 0 ? (
          <p className="bg-background p-5">Dere har ikke bedt om sendetid ennå.</p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {requests.map((request) => (
            <RequestSummary key={`${request.kind}-${request.id}`} request={request} />
          ))}
        </div>
      </section>
    </div>
  );
};
