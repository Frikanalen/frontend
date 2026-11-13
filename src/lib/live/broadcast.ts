/**
 * Where a live source stands against the schedule: on air, waiting for a
 * booked broadcast, or with nothing booked. The schedule is what puts a
 * source on air, so "on air" here means its booked time has come.
 */
export type Booking = { id: number; name: string; starttime: string; endtime: string };

export type BroadcastState =
  | { state: "onair"; booking: Booking; remaining: number }
  | { state: "upcoming"; booking: Booking; until: number }
  | { state: "none" };

/** `bookings` are the source's unfinished broadcasts, soonest first. */
export const broadcastState = (bookings: readonly Booking[], now: number): BroadcastState => {
  for (const booking of bookings) {
    const start = Date.parse(booking.starttime);
    const end = Date.parse(booking.endtime);
    if (now >= end) continue;
    if (now >= start) return { state: "onair", booking, remaining: end - now };
    return { state: "upcoming", booking, until: start - now };
  }
  return { state: "none" };
};

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * A clock counting down: "12:34", "1:02:03", and days ahead "3 d 04:05:06".
 * Rounded up, so it reads 0:01 until the moment itself.
 */
export const formatCountdown = (milliseconds: number) => {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days} d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
};
