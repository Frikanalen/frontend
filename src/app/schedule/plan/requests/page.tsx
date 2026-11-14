import { getUserOrNull } from "@/app/getUserOrNull";
import { StaffQueue } from "@/app/requests/StaffQueue";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Metadata } from "next";
import { PlanHeader } from "../PlanNav";
import { redirect } from "next/navigation";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = {
  title: "Forespørsler - Frikanalen",
};

/** Staff answer organizations' requests for airtime here. */
export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff) redirect("/profile");

  return (
    <main className="w-full max-w-7xl grow space-y-5 px-4 pt-10 pb-10 sm:px-6">
      <PlanHeader title="Forespørsler">
        Organisasjonenes forespørsler om fast sendeflate, sendetid én gang og endring etter fristen.
        Svaret vises for organisasjonen.
      </PlanHeader>
      <StaffQueue />
    </main>
  );
}
