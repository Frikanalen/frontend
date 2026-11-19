import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ssrRecurringSlotsPublicList } from "@/generated/ssr/recurring-slots/recurring-slots";
import type { PublicRecurringSlot } from "@/generated/frikanalenDjangoAPI.schemas";
import { PublicSlotWeek } from "./PublicSlotWeek";

export const metadata: Metadata = {
  title: "Faste sendeflater - Frikanalen",
  description: "Hvilke medlemsorganisasjoner som har fast sendetid på Frikanalen, og når.",
};

/**
 * The regular slots change seldom and are the same for everyone, so one
 * copy serves every visitor for a while.
 */
const fetchSlots = async (): Promise<PublicRecurringSlot[]> => {
  "use cache";
  cacheLife("minutes");
  cacheTag("recurring-slots");
  const { data, status } = await ssrRecurringSlotsPublicList();
  if (status !== 200) throw new Error(`Regular slots: the API answered ${status}`);
  return data;
};

/** Asked at request time (Django isn't there during the build), from the cache above. */
const Slots = async () => {
  await connection();
  const slots = await fetchSlots().catch((error: unknown) => {
    console.error("Could not load the regular slots", error);
    return null;
  });
  if (!slots)
    return <p className="text-default-600">De faste sendeflatene kan ikke vises akkurat nå.</p>;
  return <PublicSlotWeek slots={slots} />;
};

/**
 * Frikanalen's regular week, for everyone: which member has which slot. The
 * staff edit the same slots at /schedule/plan/slots.
 */
export default function Page() {
  return (
    <main className="w-full max-w-7xl grow space-y-8 px-4 pt-10 pb-10 sm:px-6">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold">
          <Link className="text-link hover:underline" href="/schedule">
            ← Sendeplan
          </Link>
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Faste sendeflater</h1>
        <p className="text-xl text-default-700">
          En fast sendeflate er et tidsrom som tilhører én medlemsorganisasjon, uke etter uke.
          Organisasjonen bestemmer selv hva som sendes der.{" "}
          <Link className="font-semibold text-link hover:underline" href="/about/airtime">
            Slik fordeles sendetiden
          </Link>
        </p>
      </header>
      <Suspense fallback={<div className="min-h-[48rem]" />}>
        <Slots />
      </Suspense>
    </main>
  );
}
