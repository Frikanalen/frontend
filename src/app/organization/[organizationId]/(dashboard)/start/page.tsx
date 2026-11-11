import { getUserOrNull } from "@/app/getUserOrNull";
import { profileIsAdminOrMember } from "@/app/organization/[organizationId]/admin/profileIsAdminOrMember";
import { OnboardingSteps } from "@/app/organization/onboarding/OnboardingSteps";
import { isOnboarded, nextStep, onboardingSteps } from "@/app/organization/onboarding/steps";
import { ssrGrantsList } from "@/generated/ssr/grants/grants";
import { ssrOrganizationRetrieve } from "@/generated/ssr/organization/organization";
import { ssrVideosList } from "@/generated/ssr/videos/videos";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { OrganizationParams, parseParamsOr404 } from "@/lib/routeParams";
import type { Metadata } from "next";
import { forbidden, notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Kom i gang - Frikanalen" };
export const dynamic = "force-dynamic";

/** How many of something there are, or none if the API would not say. */
const countOf = (response: { status: number; data: unknown }) =>
  response.status === 200 ? (response.data as { count: number }).count : 0;

export default async function Page({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await parseParamsOr404(OrganizationParams, params);
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  if (!user) redirect("/login");
  if (!user.isStaff && !profileIsAdminOrMember(organizationId, user)) forbidden();

  const [organizationResponse, videos, grants] = await Promise.all([
    ssrOrganizationRetrieve(organizationId, { headers, cache: "no-store" }),
    ssrVideosList({ organization: organizationId, limit: 1 }, { headers, cache: "no-store" }),
    ssrGrantsList({ organization: organizationId, limit: 1 }, { headers, cache: "no-store" }),
  ]);
  if (organizationResponse.status !== 200) notFound();
  const organization = organizationResponse.data;

  const steps = onboardingSteps({
    organizationId,
    loggedIn: true,
    identityConfirmed: user.identityConfirmed,
    isStaff: user.isStaff,
    isMember: organization.fkmember,
    videoCount: countOf(videos),
    grantCount: countOf(grants),
  });
  const next = nextStep(steps);
  const finished = steps.filter(({ state }) => state === "done").length;

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold tracking-wide text-default-600 uppercase">
          {organization.name}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Kom i gang</h1>
        <p className="mt-3 max-w-2xl text-lg text-default-700">
          {isOnboarded(steps)
            ? "Alt er på plass. Dere kan laste opp videoer og sette opp sendinger."
            : next
              ? `Neste for dere: ${next.title.toLowerCase()}.`
              : "Dere har gjort det dere kan nå. Resten venter på Frikanalen."}
        </p>
        <p className="mt-1 text-default-600">
          {finished} av {steps.length} steg er ferdige.
        </p>
      </header>
      <OnboardingSteps steps={steps} />
    </section>
  );
}
