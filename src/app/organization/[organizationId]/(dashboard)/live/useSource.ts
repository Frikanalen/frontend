"use client";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { useOrganizationLiveSourcesList } from "@/generated/organization/organization";
import { useEffect, useState } from "react";

const BOOKINGS_INTERVAL_MS = 30_000;

/**
 * A source kept current while its page stays open: a broadcast booked or
 * moved shows up without a reload. Starts from what the server rendered.
 */
export const useSource = (organizationId: number, initial: LiveSource): LiveSource => {
  const query = useOrganizationLiveSourcesList(organizationId, {
    query: { refetchInterval: BOOKINGS_INTERVAL_MS },
  });
  const sources = query.data?.status === 200 ? query.data.data : undefined;
  return sources?.find(({ id }) => id === initial.id) ?? initial;
};

/**
 * The time, ticking. `offset` corrects this computer's clock by the
 * server's, since a countdown to air is only as good as the clock it reads.
 * Zero until mounted, so server and first client render agree.
 */
export const useNow = (offset = 0, intervalMs = 1000) => {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now() + offset);
    tick();
    const timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  }, [offset, intervalMs]);
  return now;
};
