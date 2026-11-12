"use client";
import type { ReviewStatusEnum } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantRequestsList } from "@/generated/grant-requests/grant-requests";
import { useRecurringSlotRequestsList } from "@/generated/recurring-slot-requests/recurring-slot-requests";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { fromGrantRequest, fromSlotRequest, sortRequests } from "./requests";

/** Every kind of request, one list: an organization's, or all for staff. */
export const useRequests = (params: { organization?: number; status?: ReviewStatusEnum } = {}) => {
  const query = { ...params, limit: 500 };
  const grants = useGrantRequestsList(query);
  const slots = useRecurringSlotRequestsList(query);
  const requests = useMemo(
    () =>
      sortRequests([
        ...(grants.data?.data.results ?? []).map(fromGrantRequest),
        ...(slots.data?.data.results ?? []).map(fromSlotRequest),
      ]),
    [grants.data, slots.data],
  );
  return {
    requests,
    isLoading: grants.isLoading || slots.isLoading,
    error: grants.error ?? slots.error,
  };
};

/** Refetch every request list after a new request or a decision. */
export const useRefreshRequests = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/grant-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-slot-requests"] }),
    ]);
};
