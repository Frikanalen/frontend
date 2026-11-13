import { getUserOrNull } from "@/app/getUserOrNull";
import { StaffQueue } from "@/app/requests/StaffQueue";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Metadata } from "next";
import Link from "next/link";
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
      <header>
        <Link className="text-sm font-semibold text-link hover:underline" href="/schedule/plan">
          ← Sendetid
        </Link>
        <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">Forespørsler</h1>
        <p className="mt-2 max-w-3xl text-default-600">
          Organisasjonenes forespørsler om fast sendeflate, sendetid én gang og endring etter
          fristen. Svaret vises for organisasjonen.
        </p>
      </header>
      <StaffQueue />
    </main>
  );
}
