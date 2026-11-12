import { describe, expect, it } from "vitest";
import type { RecurringSlotRequestEnvelope } from "@/generated/frikanalenDjangoAPI.schemas";
import { fromSlotRequest, sortRequests, type AnyRequest } from "./requests";

const base = {
  id: 1,
  organization: 3,
  organizationName: "NUUG",
  requestedBy: 7,
  requestedByName: "Mia",
  status: "pending" as const,
  reviewedBy: null,
  adminComment: "",
  createdAt: "2026-11-12T10:00:00Z",
  reviewedAt: null,
};

describe("fromSlotRequest", () => {
  it("describes a weekly slot request", () => {
    const envelope = {
      creation: { ...base, day: 1, startTime: "16:00:00", duration: "01:30:00", slot: null },
    } as unknown as RecurringSlotRequestEnvelope;
    const request = fromSlotRequest(envelope);
    expect(request.kind).toBe("creation");
    expect(request.summary).toBe("Hver tirsdag 16:00–17:30 (1 t 30 min)");
  });
});

describe("sortRequests", () => {
  const request = (
    id: number,
    status: AnyRequest["status"],
    createdAt: string,
    reviewedAt?: string,
  ) =>
    ({
      ...base,
      kind: "airtime",
      id,
      status,
      createdAt,
      reviewedAt: reviewedAt ?? null,
      message: "",
      summary: "",
    }) as AnyRequest;

  it("puts the pending queue first, oldest first, then the newest decisions", () => {
    const sorted = sortRequests([
      request(1, "approved", "2026-11-01T00:00:00Z", "2026-11-02T00:00:00Z"),
      request(2, "pending", "2026-11-05T00:00:00Z"),
      request(3, "pending", "2026-11-03T00:00:00Z"),
      request(4, "denied", "2026-11-01T00:00:00Z", "2026-11-04T00:00:00Z"),
    ]);
    expect(sorted.map((item) => item.id)).toEqual([3, 2, 4, 1]);
  });
});
