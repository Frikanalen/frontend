import { getUserOrNull } from "@/app/getUserOrNull";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlanHeader } from "../PlanNav";
import { BulletinsBoard } from "./BulletinsBoard";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = {
  title: "Meldinger - Frikanalen",
};

/** Staff write the channel's own messages for the screen here. */
export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff) redirect("/profile");

  return (
    <main className="w-full max-w-7xl grow space-y-5 px-4 pt-10 pb-10 sm:px-6">
      <PlanHeader title="Meldinger">
        Frikanalens egne meldinger til seerne. De vises på lufta i pausene mellom programmene og i
        infografikken, så lenge du bestemmer. En lang melding deles på flere sider.
      </PlanHeader>
      <BulletinsBoard />
    </main>
  );
}
