import Link from "next/link";

// Shown in place of a suspended (is_rogue) member's page and videos. The
// wording follows the statement at /unntakstilstand.
export function SuspendedNotice({
  organization,
  context,
}: {
  organization: { id: number; name: string };
  context?: "video";
}) {
  const { name } = organization;
  return (
    <article className="prose dark:prose-invert max-w-2xl" aria-labelledby="suspended-heading">
      {context === "video" && (
        <p className="text-sm uppercase tracking-wide">
          Denne videoen er fra <Link href={`/organization/${organization.id}`}>{name}</Link>, som er
          suspendert
        </p>
      )}
      <h1 id="suspended-heading">{name} er suspendert</h1>
      <p>
        Inntil klagen vår til Enhetsregisteret er behandlet og en ekstraordinær generalforsamling
        kan avklare situasjonen, formidler vi ikke innhold fra {name}.
      </p>
      <p>
        Suspensjonen er en følge av forsøket på å sette til side Frikanalens årsmøte og overta
        styringen av organisasjonen gjennom en vedtektsstridig prosess. Etter vedtektene har {name}{" "}
        rett til å få innholdet sitt formidlet. Dette er en rettighet styret for egen regning velger
        å suspendere.
      </p>
      <p>
        Suspensjonen er ikke en reaksjon på medlemmets innhold, men på et målrettet forsøk på å
        tilsidesette organisasjonens demokrati.
      </p>
      <p>
        <Link href="/unntakstilstand">Les mer: Frikanalen i unntakstilstand</Link>
      </p>
    </article>
  );
}

type Suspension = { code: "organization_suspended"; organization: { id: number; name: string } };

/** The organization named by a video endpoint's 403, if that is what it was. */
export function suspendedOrganizationFrom(body: unknown): Suspension["organization"] | null {
  if (typeof body !== "object" || body === null) return null;
  const { code, organization } = body as Partial<Suspension>;
  if (code !== "organization_suspended" || !organization) return null;
  return organization;
}
