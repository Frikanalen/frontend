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
};

export const onboardingSteps = (facts: OnboardingFacts): OnboardingStep[] => {
  const { organizationId: id, loggedIn, isMember } = facts;
  const registered = id !== null;

  return [
    {
      id: "account",
      title: "Opprett en bruker",
      text: "Den som registrerer organisasjonen blir dens redaktør, så bruk din egen konto.",
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
      title: "Registrer organisasjonen",
      text: "Organisasjonsnummer, navn, adresse og en kort beskrivelse. Redaktørens navn og kontaktinformasjon blir offentlig, slik kringkastingsloven krever.",
      state: registered ? "done" : loggedIn ? "todo" : "blocked",
      actions:
        registered || !loggedIn
          ? []
          : [{ href: "/organization/register", label: "Registrer organisasjonen" }],
    },
    {
      id: "affidavit",
      title: "Send inn redaktørerklæringen",
      text: isMember
        ? "Frikanalen har mottatt erklæringen, godkjent medlemskapet og bekreftet redaktørens identitet."
        : "Redaktøren skriver ut erklæringen om redaktøransvar, signerer den og sender den til foreningen per post. Når brevet er mottatt, godkjenner Frikanalen medlemskapet. Det bekrefter også redaktørens identitet.",
      state: isMember ? "done" : registered ? "waiting" : "blocked",
      actions: isMember
        ? []
        : [
            registered
              ? { href: `/organization/${id}/affidavit`, label: "Skriv ut erklæringen" }
              : { href: "/about/join/affidavit", label: "Se erklæringen" },
            { href: "/about/join", label: "Kontingent og vilkår" },
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
