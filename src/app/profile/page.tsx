import { Metadata } from "next";
import { redirect } from "next/navigation";
import { GoCalendar } from "react-icons/go";
import { getCookiesFromRequest } from "@/app/profile/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import { AccountHeader } from "@/app/profile/AccountHeader";
import { ActionLink } from "@/app/profile/ActionLink";
import { IdentityNotice } from "@/app/profile/IdentityNotice";
import { OrganizationSection } from "@/app/profile/OrganizationSection";

export const metadata: Metadata = {
  title: "Min side - Frikanalen",
};

/**
 * Staff can programme the whole schedule rather than one organization's slots,
 * and /schedule/plan is otherwise reachable only by typing the URL: every link
 * to it in the UI is the per-organization one. Since this page is where a
 * signed-in user starts, the tool belongs here.
 */
const StaffTools = () => (
  <section aria-labelledby="staff-heading" className="bg-background rounded-xl p-6 shadow-lg">
    <h2 id="staff-heading" className="text-xl font-bold">
      Verktøy for stab
    </h2>
    <p className="text-foreground/75 mt-1">
      Du kan programmere sendeplanen på tvers av alle organisasjoner.
    </p>
    <div className="mt-3">
      <ActionLink href="/schedule/plan" variant="solid" icon={<GoCalendar />}>
        Programmer hele sendeplanen
      </ActionLink>
    </div>
  </section>
);

export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  // /login sends you back here once you're signed in, so a bounce to the front
  // page just loses the trip. (The edit page under this one already did this.)
  if (!user) redirect("/login");

  // Staff are exempt from the identity check, the same way the scheduling page
  // exempts them, so warning them about it would be a warning about nothing.
  const isBlockedFromScheduling = !user.identityConfirmed && !user.isStaff;

  return (
    <div className="flex flex-col gap-6">
      <AccountHeader user={user} />
      {isBlockedFromScheduling && <IdentityNotice />}
      <OrganizationSection memberOf={user.memberOf} editorOf={user.editorOf} />
      {user.isStaff && <StaffTools />}
    </div>
  );
}
