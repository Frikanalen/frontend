import { getUserOrNull } from "@/app/getUserOrNull";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlanHeader } from "../PlanNav";
import { AirLog } from "./AirLog";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = {
  title: "Sendelogg - Frikanalen",
};

/** Staff look back at what went out on the stream. */
export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff) redirect("/profile");

  return (
    <main className="w-full max-w-7xl grow space-y-5 px-4 pt-10 pb-10 sm:px-6">
      <PlanHeader title="Sendelogg">
        Opptak av det nettstrømmen har sendt, i lav kvalitet, den siste uken. Det nyeste er noen
        sekunder gammelt. Eldre enn en uke slettes av seg selv.
      </PlanHeader>
      <AirLog />
    </main>
  );
}
