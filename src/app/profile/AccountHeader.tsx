import { User } from "@/generated/frikanalenDjangoAPI.schemas";
import { GoPencil, GoShieldCheck } from "react-icons/go";
import { ActionLink } from "@/app/profile/ActionLink";
import { LogOutButton } from "@/app/profile/LogOutButton";

/** Initials, or a single letter, or nothing — whatever the name gives us. */
const initialsOf = ({ firstName, lastName }: User) =>
  [firstName, lastName]
    .map((part) => part?.trim()?.[0] ?? "")
    .join("")
    .toUpperCase();

/**
 * Who you are signed in as, and the two things you can do about that.
 *
 * Deliberately not a record of your details: name and e-mail are here because
 * they answer "am I in the right account", and the rest — phone number, date
 * of birth, when you joined — lives one click away behind "Endre profil",
 * which is the only place any of it can be acted on anyway. The old page
 * opened with all of it as loose `Navn: …` divs under two headings that said
 * the same thing twice ("Brukerside", then "Din brukerprofil"), which put the
 * least actionable content on the page in its most valuable space.
 */
export const AccountHeader = ({ user }: { user: User }) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const initials = initialsOf(user);

  return (
    <header className="bg-background rounded-xl p-6 shadow-lg">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div
          aria-hidden="true"
          className="bg-primary-100 text-primary-800 flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold"
        >
          {initials}
        </div>

        <div className="min-w-0 grow">
          <p className="text-foreground/75 text-sm">Min side</p>
          {/* The account's own name is the page's subject, so it is the h1.
              The old page had no h1 at all and opened at h2. */}
          <h1 className="text-3xl font-bold break-words">{fullName || "Min side"}</h1>
          <p className="text-foreground/75 mt-0.5 break-words">{user.email}</p>

          {(user.identityConfirmed || user.isStaff) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {user.identityConfirmed && (
                <span className="bg-primary-100 text-primary-800 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  <GoShieldCheck aria-hidden="true" />
                  Identitet bekreftet
                </span>
              )}
              {user.isStaff && (
                <span className="bg-secondary-100 text-secondary-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  Stab
                </span>
              )}
            </div>
          )}
        </div>

        {/* Both account-level, both quiet: neither is what you came to the page
            to do, and putting either at the weight of "Ny video" would compete
            with the organizations below for no good reason. */}
        <div className="flex shrink-0 flex-col items-stretch gap-1">
          <ActionLink href="/profile/edit" icon={<GoPencil />} className="justify-start">
            Endre profil
          </ActionLink>
          <LogOutButton />
        </div>
      </div>
    </header>
  );
};
