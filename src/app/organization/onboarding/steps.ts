/**
 * The road from "we would like to be on Frikanalen" to a first broadcast, as
 * the steps an organization actually has to take and whose move each one is.
 *
 * Nothing here is stored: every state is read off what the API already says
 * about the user, the organization, its videos and its airtime.
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
  id: "account" | "organization" | "video" | "affidavit" | "identity" | "authority" | "airtime";
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
  videoCount: number;
  grantCount: number;
};

export const onboardingSteps = (facts: OnboardingFacts): OnboardingStep[] => {
  const { organizationId: id, loggedIn, isMember, videoCount, grantCount } = facts;
  const registered = id !== null;
  const identityOk = facts.identityConfirmed || facts.isStaff;
  const mayBroadcast = isMember && identityOk;
  const base = `/organization/${id}`;

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
      id: "video",
      title: "Last opp den første videoen",
      text: "Dere kan laste opp med en gang. Videoene blir synlige for alle når medlemskapet er godkjent.",
      state: videoCount > 0 ? "done" : registered ? "todo" : "blocked",
      actions: !registered
        ? []
        : videoCount > 0
          ? [{ href: `${base}/admin`, label: "Se videoene" }]
          : [{ href: `${base}/create`, label: "Ny video" }],
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
    {
      id: "airtime",
      title: "Sett opp den første sendingen",
      text: !mayBroadcast
        ? "Når medlemskapet er godkjent og identiteten din er bekreftet, kan dere få sendetid og sette opp hva som skal sendes."
        : grantCount > 0
          ? "Dere har fått sendetid. Sett opp hva som skal sendes før fristen."
          : "Frikanalen tildeler sendetid. Ta kontakt for å få en fast sendeflate eller en enkelt sending.",
      state: !mayBroadcast ? "blocked" : grantCount > 0 ? "todo" : "waiting",
      actions: !mayBroadcast
        ? [{ href: "/schedule/plan/rules", label: "Slik virker sendetid" }]
        : grantCount > 0
          ? [{ href: `${base}/schedule`, label: "Gå til sendetid" }]
          : [
              { href: "/about/contact", label: "Be om sendetid" },
              { href: "/schedule/plan/rules", label: "Slik virker sendetid" },
            ],
    },
  ];
};

/** The first step that is the organization's own to take now, if there is one. */
export const nextStep = (steps: readonly OnboardingStep[]) =>
  steps.find(({ state }) => state === "todo");

/** Onboarding is over when nothing is left for either side to do. */
export const isOnboarded = (steps: readonly OnboardingStep[]) =>
  steps.every(({ state, id }) => state === "done" || state === "self" || id === "airtime") &&
  steps.find(({ id }) => id === "airtime")?.state !== "blocked";
