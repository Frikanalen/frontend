import type {
  GrantRequestEnvelope,
  RecurringSlotRequestEnvelope,
  ReviewStatusEnum,
} from "@/generated/frikanalenDjangoAPI.schemas";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { inOsloTime } from "@/lib/osloTime";
import {
  formatLength,
  formatTime,
  parseDuration,
  parseTime,
  WEEKDAYS,
} from "@/app/schedule/plan/slots/slots";

/**
 * The four kinds of request an organization can make, flattened into one
 * shape so members and staff see them as one list. The API keeps them apart
 * because approving each does something different.
 */
export type RequestKind = "airtime" | "exemption" | "creation" | "ownership";

export type AnyRequest = {
  kind: RequestKind;
  id: number;
  organization: number;
  organizationName: string;
  requestedByName: string;
  message: string;
  status: ReviewStatusEnum;
  adminComment: string;
  createdAt: string;
  reviewedAt: string | null;
  /** What is asked for, in a sentence. */
  summary: string;
  /** Where the result can be seen once approved. */
  grant?: number | null;
};

export const KIND_LABELS: Record<RequestKind, string> = {
  airtime: "Sendetid én gang",
  exemption: "Endring etter fristen",
  creation: "Fast sendeflate",
  ownership: "Overta sendeflate",
};

export const STATUS_LABELS: Record<ReviewStatusEnum, string> = {
  pending: "Venter på svar",
  approved: "Godkjent",
  denied: "Avslått",
};

const day = (instant: string) => format(inOsloTime(instant), "EEEE d. MMMM", { locale: nb });
const clock = (instant: string) => format(inOsloTime(instant), "HH:mm");

/** "fredag 20. november 19:00–20:00". */
export const windowText = (start: string, end: string) =>
  `${day(start)} ${clock(start)}–${clock(end)}`;

export const fromGrantRequest = (envelope: GrantRequestEnvelope): AnyRequest => {
  if (envelope.airtime) {
    const request = envelope.airtime;
    return {
      ...request,
      kind: "airtime",
      message: request.message ?? "",
      summary: windowText(request.starttime, request.endtime),
    };
  }
  const request = envelope.exemption;
  return {
    ...request,
    kind: "exemption",
    message: request.message ?? "",
    summary: `Sendetiden ${windowText(request.grantStarttime, request.grantEndtime)}`,
  };
};

export const fromSlotRequest = (envelope: RecurringSlotRequestEnvelope): AnyRequest => {
  if (envelope.creation) {
    const request = envelope.creation;
    const start = parseTime(request.startTime);
    const length = parseDuration(request.duration);
    return {
      ...request,
      kind: "creation",
      message: request.message ?? "",
      grant: undefined,
      summary: `Hver ${WEEKDAYS[request.day].toLowerCase()} ${formatTime(start)}–${formatTime(start + length)} (${formatLength(length)})`,
    };
  }
  const request = envelope.ownership;
  return {
    ...request,
    kind: "ownership",
    message: request.message ?? "",
    summary: request.slotDescription,
  };
};

/** Pending first, oldest first, so the queue reads in the order it came in;
 * decided ones after, newest decision first. */
export const sortRequests = (requests: AnyRequest[]) =>
  [...requests].sort((a, b) => {
    if ((a.status === "pending") !== (b.status === "pending"))
      return a.status === "pending" ? -1 : 1;
    if (a.status === "pending") return a.createdAt.localeCompare(b.createdAt);
    return (b.reviewedAt ?? b.createdAt).localeCompare(a.reviewedAt ?? a.createdAt);
  });
