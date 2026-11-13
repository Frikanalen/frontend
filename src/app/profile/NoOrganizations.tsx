import { GoPlus } from "react-icons/go";
import { ActionLink } from "@/app/profile/ActionLink";

/**
 * What a brand-new account sees — and it sees it immediately, because
 * registration lands here. The old page rendered "Dine organisasjoner"
 * followed by nothing at all, at the one moment the user most needs telling
 * what to do next.
 */
export const NoOrganizations = () => (
  <section className="border-default-300 rounded-xl border border-dashed p-6 text-center">
    <h2 className="text-lg font-semibold">Du er ikke med i noen organisasjon ennå</h2>
    <p className="text-foreground/75 mx-auto mt-2 max-w-prose">
      Alt som sendes på Frikanalen sendes på vegne av en organisasjon. Registrer din, så kan du
      laste opp videoer og programmere sendetid.
    </p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <ActionLink href="/organization/register" variant="solid" icon={<GoPlus />}>
        Registrer organisasjon
      </ActionLink>
      <ActionLink href="/about/join">Hva innebærer medlemskap?</ActionLink>
    </div>
  </section>
);
