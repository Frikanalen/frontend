import Link from "next/link";
import { GoPlus } from "react-icons/go";
import type { User } from "@/generated/frikanalenDjangoAPI.schemas";
import { ActionLink } from "@/app/profile/ActionLink";
import { mergeMemberships, studioHref } from "@/app/profile/studio";

/**
 * The organizations you work for, and your role in each. Studio in the
 * channel bar already leads to them, but this is where you see them all at
 * once and what you are in each: the editor answers for the organization and
 * decides who its members are, under Studio → Organisasjon.
 */
export const Organizations = ({ user }: { user: Pick<User, "memberOf" | "editorOf"> }) => {
  const memberships = mergeMemberships(user.memberOf, user.editorOf);
  if (memberships.length === 0) return null;

  return (
    <section
      aria-labelledby="organizations-heading"
      className="bg-background rounded-xl p-6 shadow-lg"
    >
      <h2 id="organizations-heading" className="text-xl font-bold">
        Dine organisasjoner
      </h2>
      <ul className="divide-default-200 border-default-200 mt-3 divide-y border-y">
        {memberships.map((org) => (
          <li
            key={org.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
          >
            <div className="min-w-0">
              <Link
                href={studioHref(org.id)}
                className="text-link font-semibold break-words hover:underline"
              >
                {org.name} →
              </Link>
              <p className="text-foreground/75 text-sm">
                {org.isEditor
                  ? "Redaktør: du svarer for organisasjonen og bestemmer hvem som er medlemmer."
                  : "Medlem: du jobber på vegne av organisasjonen."}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <ActionLink href="/organization/register" icon={<GoPlus />} className="-ml-4">
          Registrer en organisasjon til
        </ActionLink>
      </div>
    </section>
  );
};
