import cx from "classnames";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import type { ReactNode } from "react";
import { inOsloTime } from "@/lib/osloTime";
import { KIND_LABELS, STATUS_LABELS, type AnyRequest } from "./requests";

const STATUS_STYLES = {
  pending: "bg-warning/25 text-foreground",
  approved: "bg-success text-success-foreground",
  denied: "bg-danger/15 text-danger-700",
};

const when = (instant: string) => format(inOsloTime(instant), "d. MMM yyyy", { locale: nb });

/**
 * One request as both sides need it: what was asked, by whom, what they
 * said, and, once decided, the answer. `showOrganization` is for staff, who
 * see every organization's requests together.
 */
export const RequestSummary = ({
  request,
  showOrganization = false,
  children,
}: {
  request: AnyRequest;
  showOrganization?: boolean;
  /** Actions, such as a staff member's decision form. */
  children?: ReactNode;
}) => (
  <article className="space-y-2 bg-background p-4" data-request={`${request.kind}-${request.id}`}>
    <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-xs font-bold tracking-wide text-default-600 uppercase">
        {KIND_LABELS[request.kind]}
      </span>
      {showOrganization ? <span className="font-semibold">{request.organizationName}</span> : null}
      <span
        className={cx("ms-auto px-2 py-0.5 text-xs font-semibold", STATUS_STYLES[request.status])}
      >
        {STATUS_LABELS[request.status]}
      </span>
    </header>
    <p className="text-lg font-semibold first-letter:uppercase">{request.summary}</p>
    {request.message ? (
      <blockquote className="border-l-2 border-default-300 ps-3 text-sm whitespace-pre-line">
        {request.message}
      </blockquote>
    ) : null}
    <p className="text-xs text-default-600">
      Sendt {when(request.createdAt)} av {request.requestedByName}
    </p>
    {request.status !== "pending" && request.adminComment ? (
      <p className="bg-default-100 p-3 text-sm">
        <span className="font-semibold">Svar fra Frikanalen:</span> {request.adminComment}
      </p>
    ) : null}
    {children}
  </article>
);
