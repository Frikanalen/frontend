"use client";
import { broadcastState, type Booking } from "@/lib/live/broadcast";
import { formatElapsed } from "@/lib/live/signal";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";

export const bookingDay = (booking: Booking) =>
  format(inOsloTime(booking.starttime), "EEEE d. MMMM", { locale: nb });

/** One line on where the source stands against the schedule. */
export const BookingStatus = ({
  bookings,
  now,
}: {
  bookings: readonly Booking[];
  /** Zero before the clock has started; nothing is claimed then. */
  now: number;
}) => {
  const status = now ? broadcastState(bookings, now) : { state: "none" as const };
  if (status.state === "onair")
    return (
      <span className="font-semibold text-danger-700">
        På lufta nå: «{status.booking.name}», til {formatOsloTime(status.booking.endtime)}
      </span>
    );
  if (status.state === "upcoming")
    return (
      <span>
        Neste sending: «{status.booking.name}», {bookingDay(status.booking)} kl.{" "}
        {formatOsloTime(status.booking.starttime)}–{formatOsloTime(status.booking.endtime)}{" "}
        <span className="text-default-600">(om {formatElapsed(status.until)})</span>
      </span>
    );
  return <span className="text-default-600">Ingen sending er satt opp.</span>;
};
