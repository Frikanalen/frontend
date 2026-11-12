import { OrgCreateForm } from "@/app/organization/register/OrgCreateForm";
import { OnboardingSteps } from "@/app/organization/onboarding/OnboardingSteps";
import { onboardingSteps } from "@/app/organization/onboarding/steps";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";
import { getUserOrNull } from "@/app/getUserOrNull";
import Link from "next/link";

export default async function Page() {
  const headers = await getCookiesFromRequest();
  const user = await getUserOrNull(headers);
  const steps = onboardingSteps({
    organizationId: null,
    loggedIn: !!user,
    identityConfirmed: !!user?.identityConfirmed,
    isStaff: !!user?.isStaff,
    isMember: false,
  });

  return (
    <div className="w-full max-w-7xl px-4 pt-10 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Meld inn organisasjonen</h1>
      <p className="mt-4 max-w-3xl text-xl text-default-700">
        Fem steg til aktivt medlemskap. De to første tar noen minutter.
      </p>
      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside aria-label="Stegene" className="lg:sticky lg:top-6">
          <OnboardingSteps compact current={user ? "organization" : "account"} steps={steps} />
        </aside>
        <div className="bg-background p-6 text-foreground sm:p-8">
          {user ? (
            <>
              <h2 className="text-2xl font-bold">Om organisasjonen</h2>
              <p className="mt-2 max-w-2xl text-default-700">
                Du blir organisasjonens redaktør. E-postadressen din ({user.email}) og
                telefonnummeret ditt ({user.phoneNumber || "ikke oppgitt"}) blir offentlig synlige,
                i tråd med kringkastingslovens krav om kontaktinformasjon for redaktører.
              </p>
              <OrgCreateForm className="mt-6" />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Først trenger du en bruker</h2>
              <p className="mt-2 max-w-2xl text-default-700">
                Den som registrerer organisasjonen blir dens redaktør. Opprett en bruker eller logg
                inn, så fortsetter du her.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  className="inline-flex h-11 items-center rounded-md bg-accent px-5 font-semibold text-accent-foreground hover:opacity-90"
                  href="/register"
                >
                  Registrer bruker
                </Link>
                <Link className="font-semibold text-link hover:underline" href="/login">
                  Jeg har en bruker, logg inn
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
