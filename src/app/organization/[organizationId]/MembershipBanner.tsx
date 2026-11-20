"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type MembershipBannerState = "none" | "pending" | "rejected";

const COPY: Record<
  MembershipBannerState,
  { border: string; title: string; text: string; action: string }
> = {
  none: {
    border: "border-warning",
    title: "Registreringen er ikke ferdig",
    text: "Organisasjonen blir medlem når Frikanalen har godkjent redaktørerklæringen. Til da vises ikke videoene offentlig, og organisasjonen kan ikke få sendetid.",
    action: "Last ned og last opp erklæringen",
  },
  pending: {
    border: "border-accent",
    title: "Erklæringen venter på Frikanalen",
    text: "Redaktørerklæringen er lastet opp. Du får e-post når Frikanalen har sjekket den. Til da vises ikke videoene offentlig, og organisasjonen kan ikke få sendetid.",
    action: "Se erklæringen",
  },
  rejected: {
    border: "border-danger",
    title: "Erklæringen ble ikke godkjent",
    text: "Frikanalen kunne ikke godkjenne redaktørerklæringen. Se hvorfor, og last opp en ny for å fullføre registreringen.",
    action: "Se hvorfor",
  },
};

/**
 * Until the membership is approved, every studio page says so, and what to do
 * about it: the "Kom i gang" tab alone is too easy to miss. Not shown on the
 * pages that already are the next step.
 */
export const MembershipBanner = ({
  organizationId,
  state,
}: {
  organizationId: number;
  state: MembershipBannerState;
}) => {
  const path = usePathname();
  const base = `/organization/${organizationId}`;
  if (path.startsWith(`${base}/start`) || path.startsWith(`${base}/affidavit`)) return null;
  const { border, title, text, action } = COPY[state];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
      <section
        aria-label="Medlemskap"
        className={`flex flex-col gap-2 border-l-8 ${border} bg-background p-4 shadow-sm sm:p-5`}
      >
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="max-w-3xl">{text}</p>
        <p className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            className="inline-flex min-h-10 items-center rounded-md bg-brand-deep px-4 font-semibold text-white hover:bg-brand-deep/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            href={`${base}/affidavit`}
          >
            {action} →
          </Link>
          <Link className="font-semibold text-link hover:underline" href={`${base}/start`}>
            Se alle stegene
          </Link>
        </p>
      </section>
    </div>
  );
};
