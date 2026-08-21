import Link from "next/link";
import { GoAlert } from "react-icons/go";

/**
 * Frikanalen confirms who a user is before letting them put anything on air.
 * Until it has, "Programmer sendeplan" leads to a wall — the scheduling page
 * checks `identityConfirmed` and refuses — so the warning belongs here, on the
 * page those buttons are on, rather than one click after the user has
 * committed to the task. The profile page already had the flag in hand and
 * threw it away.
 *
 * The colours are all from the warning scale and none of them are theme-
 * qualified: that scale inverts between the two themes, so `warning-50`
 * behind `warning-900` is a pale panel with dark text in one and a dark panel
 * with pale text in the other. Reaching for the page's own `foreground` here
 * instead put pale green text on this panel in the dark theme, at 3.0:1.
 */
export const IdentityNotice = () => (
  <section
    aria-labelledby="identity-notice-heading"
    className="border-warning-300 bg-warning-50 text-warning-900 rounded-xl border p-5"
  >
    <div className="flex gap-3">
      <GoAlert aria-hidden="true" className="text-warning-800 mt-1 shrink-0" />
      <div>
        <h2 id="identity-notice-heading" className="font-semibold">
          Identiteten din er ikke bekreftet ennå
        </h2>
        <p className="mt-1">
          Du kan laste opp videoer som vanlig, men Frikanalen må bekrefte hvem du er før du kan
          programmere sendetid.
        </p>
        <Link href="/about/contact" className="text-warning-800 mt-2 inline-block underline">
          Ta kontakt med Frikanalen
        </Link>
      </div>
    </div>
  </section>
);
