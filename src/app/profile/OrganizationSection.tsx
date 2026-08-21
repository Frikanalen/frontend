import { SimpleOrg } from "@/generated/frikanalenDjangoAPI.schemas";
import { GoPlus } from "react-icons/go";
import { ActionLink } from "@/app/profile/ActionLink";
import { Membership, OrganizationCard } from "@/app/profile/OrganizationCard";

/**
 * One entry per organization, editor winning wherever a user holds both roles.
 *
 * Sorted by name so the list keeps its order between visits: the two arrays
 * arrive in whatever order the API happened to serialise them, and a list that
 * reshuffles under you is a list you have to re-read every time.
 */
export const mergeMemberships = (
  memberOf: readonly SimpleOrg[],
  editorOf: readonly SimpleOrg[],
): Membership[] => {
  const byId = new Map(memberOf.map((org) => [org.id, { ...org, isEditor: false }]));
  editorOf.forEach((org) => byId.set(org.id, { ...org, isEditor: true }));

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "nb"));
};

/**
 * What a brand-new account sees — and it sees it immediately, because
 * registration lands here. The old page rendered "Dine organisasjoner"
 * followed by nothing at all, at the one moment the user most needs telling
 * what to do next.
 */
const NoOrganizations = () => (
  <div className="border-default-300 rounded-xl border border-dashed p-6 text-center">
    <h3 className="text-lg font-semibold">Du er ikke med i noen organisasjon ennå</h3>
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
  </div>
);

/**
 * The reason anyone signs in: this is where the work is, so it leads the page
 * and gets the room. The old layout opened with a read-only dump of name,
 * e-mail and phone and pushed the organizations below it.
 */
export const OrganizationSection = ({
  memberOf,
  editorOf,
}: {
  memberOf: readonly SimpleOrg[];
  editorOf: readonly SimpleOrg[];
}) => {
  const memberships = mergeMemberships(memberOf, editorOf);

  return (
    <section
      aria-labelledby="organizations-heading"
      className="bg-background rounded-xl p-6 shadow-lg"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="organizations-heading" className="text-xl font-bold">
          Dine organisasjoner
        </h2>
        {/* Only once there is a list to add to: on an empty account this same
            action is the whole point of the panel below, and two of it would
            just split the user's attention. */}
        {memberships.length > 0 && (
          <ActionLink href="/organization/register" icon={<GoPlus />}>
            Registrer ny
          </ActionLink>
        )}
      </div>

      {memberships.length === 0 ? (
        <NoOrganizations />
      ) : (
        <ul className="flex flex-col gap-3">
          {memberships.map((organization) => (
            <OrganizationCard key={organization.id} organization={organization} />
          ))}
        </ul>
      )}
    </section>
  );
};
