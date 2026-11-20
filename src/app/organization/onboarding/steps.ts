import { affidavitHref } from "@/app/organization/[organizationId]/affidavit/affidavitHref";
/**
 * The road from "we would like to be on Frikanalen" to an active membership,
 * as the steps an organization has to take and whose move each one is. What a
 * member then does with it, uploading and broadcasting, is not part of it.
 *
 * Nothing here is stored: every state is read off what the API already says
 * about the user and the organization.
 */
export type StepState =
  /** Finished. */
  | "done"
  /** The organization's own move, and nothing stands in its way. */
  | "todo"
  /** Frikanalen's move: the organization has done what it can. */
  | "waiting"
  /** Can't be started until an earlier step is finished. */
  | "blocked";

export type StepAction = { href: string; label: string };

export type OnboardingStep = {
  id: "account" | "organization" | "affidavit";
  title: string;
  text: string;
  state: StepState;
  actions: StepAction[];
};

export type OnboardingFacts = {
  /** Null before the organization exists. */
  organizationId: number | null;
  loggedIn: boolean;
  /**
   * Frikanalen has received the editor's signed declaration and approved
   * membership. Receiving it is also what confirms the editor's identity, so
   * there is no separate step for that.
   */
  isMember: boolean;
  /** Where the latest uploaded scan of the declaration stands, if any. */
  affidavit: "none" | "pending" | "rejected";
};

export const onboardingSteps = (facts: OnboardingFacts): OnboardingStep[] => {
  const { organizationId: id, loggedIn, isMember, affidavit } = facts;
  const registered = id !== null;

  return [
    {
      id: "account",
      title: "Opprett en bruker",
      text: "Den som melder inn organisasjonen blir dens redaktør, så bruk din egen konto.",
      state: loggedIn ? "done" : "todo",
      actions: loggedIn
        ? []
        : [
            { href: "/register", label: "Registrer bruker" },
            { href: "/login", label: "Logg inn" },
          ],
    },
    {
      id: "organization",
      title: "Meld inn organisasjonen",
      text: "Organisasjonsnummer, navn, adresse og en kort beskrivelse. Redaktørens navn og kontaktinformasjon blir offentlig, slik kringkastingsloven krever.",
      state: registered ? "done" : loggedIn ? "todo" : "blocked",
      actions: registered
        ? []
        : [
            ...(loggedIn
              ? [{ href: "/organization/register", label: "Meld inn organisasjonen" }]
              : []),
            { href: "/about/join", label: "Kontingent og vilkår" },
          ],
    },
    {
      id: "affidavit",
      title: "Send inn redaktørerklæringen",
      text: isMember
        ? "Frikanalen har godkjent erklæringen. Organisasjonen er medlem, og redaktørens identitet er bekreftet."
        : affidavit === "pending"
          ? "Erklæringen er lastet opp og venter på at Frikanalen sjekker den."
          : affidavit === "rejected"
            ? "Frikanalen kunne ikke godkjenne erklæringen. Se hvorfor, og last opp en ny."
            : "Redaktøren laster ned erklæringen om redaktøransvar, skriver den ut og signerer den, og laster opp en skannet kopi. Når Frikanalen har godkjent den, blir organisasjonen medlem og redaktørens identitet bekreftet.",
      state: isMember
        ? "done"
        : !registered
          ? "blocked"
          : affidavit === "pending"
            ? "waiting"
            : "todo",
      actions: isMember
        ? []
        : [
            registered
              ? {
                  href: affidavitHref(id),
                  label: affidavit === "pending" ? "Se erklæringen" : "Last ned og last opp",
                }
              : { href: "/about/join/affidavit", label: "Se erklæringen" },
          ],
    },
  ];
};

/** The first step that is the organization's own to take now, if there is one. */
export const nextStep = (steps: readonly OnboardingStep[]) =>
  steps.find(({ state }) => state === "todo");

/** Onboarding is over when nothing is left for either side to do. */
export const isOnboarded = (steps: readonly OnboardingStep[]) =>
  steps.every(({ state }) => state === "done");
