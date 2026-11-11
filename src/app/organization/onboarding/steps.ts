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
  | "blocked"
  /** Has to be done, but nothing on this site can tell whether it has been. */
  | "self";

export type StepAction = { href: string; label: string };

export type OnboardingStep = {
  id: "account" | "organization" | "affidavit" | "identity" | "authority";
  title: string;
  text: string;
  state: StepState;
  actions: StepAction[];
};

export type OnboardingFacts = {
  /** Null before the organization exists. */
  organizationId: number | null;
  loggedIn: boolean;
  identityConfirmed: boolean;
  /** Staff are exempt from the identity check, as on the scheduling pages. */
  isStaff: boolean;
  /** Frikanalen has received the editor's declaration and approved membership. */
  isMember: boolean;
};

export const onboardingSteps = (facts: OnboardingFacts): OnboardingStep[] => {
  const { organizationId: id, loggedIn, isMember } = facts;
  const registered = id !== null;
  const identityOk = facts.identityConfirmed || facts.isStaff;

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
      text: "Navn, adresse og en kort beskrivelse. Redaktørens navn og kontaktinformasjon blir offentlig, slik kringkastingsloven krever.",
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
        ? "Frikanalen har mottatt erklæringen og godkjent medlemskapet."
        : "Redaktøren signerer en erklæring om redaktøransvar og sender den til foreningen per post. Når brevet er mottatt, godkjenner Frikanalen medlemskapet.",
      state: isMember ? "done" : registered ? "waiting" : "blocked",
      actions: isMember
        ? []
        : [
            { href: "/about/join/affidavit", label: "Se erklæringen" },
            { href: "/about/join", label: "Kontingent og vilkår" },
          ],
    },
    {
      id: "identity",
      title: "Få identiteten din bekreftet",
      text: identityOk
        ? "Frikanalen har bekreftet hvem du er."
        : "Frikanalen må vite hvem som setter opp sendinger. Ta kontakt, så bekrefter vi identiteten din.",
      state: identityOk ? "done" : loggedIn ? "waiting" : "blocked",
      actions: identityOk || !loggedIn ? [] : [{ href: "/about/contact", label: "Ta kontakt" }],
    },
    {
      id: "authority",
      title: "Registrer dere hos Medietilsynet",
      text: "Hvert medlem må selv være registrert som tjenestetilbyder og melde inn sin redaktør. Dette gjør dere hos Medietilsynet, ikke her.",
      state: registered ? "self" : "blocked",
      actions: [{ href: "/about/informasjon-om-registrering", label: "Slik gjør dere det" }],
    },
  ];
};

/** The first step that is the organization's own to take now, if there is one. */
export const nextStep = (steps: readonly OnboardingStep[]) =>
  steps.find(({ state }) => state === "todo");

/** Onboarding is over when nothing is left for either side to do. */
export const isOnboarded = (steps: readonly OnboardingStep[]) =>
  steps.every(({ state }) => state === "done" || state === "self");
