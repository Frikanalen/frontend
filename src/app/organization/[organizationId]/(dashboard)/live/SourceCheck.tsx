"use client";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { broadcastState } from "@/lib/live/broadcast";
import Link from "next/link";
import { AirtimeHandoff } from "./AirtimeHandoff";
import { BookingStatus } from "./BookingStatus";
import { SignalCheck } from "./SignalCheck";
import { useNow, useSource } from "./useSource";

/**
 * The page for confirming, ahead of a broadcast, that a source is received
 * as it should be: when it airs, whether it is ready, and where to go next.
 */
export const SourceCheck = ({
  organizationId,
  source: initial,
}: {
  organizationId: number;
  source: LiveSource;
}) => {
  const source = useSource(organizationId, initial);
  const now = useNow();
  const booked = now ? broadcastState(source.upcomingTransmissions, now).state !== "none" : true;
  const base = `/organization/${organizationId}/live`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p>
          <BookingStatus bookings={source.upcomingTransmissions} now={now} />
        </p>
        <Link
          className="inline-flex h-10 items-center border border-default-300 px-4 text-sm font-semibold hover:bg-content1"
          href={`${base}/${source.id}/monitor`}
        >
          Åpne sendeskjerm
        </Link>
      </div>

      <SignalCheck setupHref={`${base}?oppsett=${source.id}`} source={source} />

      {booked ? null : (
        <div className="border-t border-default-200 pt-5">
          <AirtimeHandoff organizationId={organizationId} source={source} />
        </div>
      )}

      <p className="border-t border-default-200 pt-4 text-sm text-default-600">
        Under selve sendingen: bruk sendeskjermen, som viser nedtelling, om dere er på lufta, og
        bildet slik Frikanalen sender det.{" "}
        <Link className="font-semibold text-link hover:underline" href={base}>
          Nøkler og oppsett for kilden
        </Link>
      </p>
    </div>
  );
};
