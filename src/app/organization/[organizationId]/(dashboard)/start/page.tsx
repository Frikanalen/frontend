import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { OnboardingSteps } from "@/app/organization/onboarding/OnboardingSteps";
import { isOnboarded, nextStep, onboardingSteps } from "@/app/organization/onboarding/steps";
import { ssrOrganizationRetrieve } from "@/generated/ssr/organization/organization";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = { title: "Kom i gang - Frikanalen" };

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const organizationResponse = await ssrOrganizationRetrieve(organizationId, {
    headers,
    cache: "no-store",
  });
  if (organizationResponse.status !== 200) notFound();
  const organization = organizationResponse.data;

  const steps = onboardingSteps({
    organizationId,
    loggedIn: true,
    identityConfirmed: user.identityConfirmed,
    isStaff: user.isStaff,
    isMember: organization.fkmember,
  });
  const next = nextStep(steps);
  const onboarded = isOnboarded(steps);
  const finished = steps.filter(({ state }) => state === "done").length;

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold tracking-wide text-default-600 uppercase">
          {organization.name}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Kom i gang</h1>
        <p className="mt-3 max-w-2xl text-lg text-default-700">
          {onboarded
            ? "Alt er på plass. Organisasjonen er et aktivt medlem."
            : next
              ? `Neste for dere: ${next.title.toLowerCase()}.`
              : "Dere har gjort det dere kan nå. Resten venter på Frikanalen."}
        </p>
        <p className="mt-1 text-default-600">
          {finished} av {steps.length} steg er ferdige.
        </p>
      </header>
      <OnboardingSteps steps={steps} />
      {/* What a member does next is its own work, not a step on the way in. */}
      <p className="flex flex-wrap items-center gap-x-6 gap-y-2 text-default-700">
        {onboarded
          ? "Medlemskapet er aktivt."
          : "Dere kan laste opp videoer mens dere venter. De blir synlige når medlemskapet er godkjent."}
        <Link
          className="font-semibold text-link hover:underline"
          href={`/organization/${organizationId}/create`}
        >
          Ny video →
        </Link>
        {onboarded ? (
          <Link
            className="font-semibold text-link hover:underline"
            href={`/organization/${organizationId}/schedule`}
          >
            Sendetid →
          </Link>
        ) : null}
      </p>
    </section>
  );
}
