"use client";
import type { AirtimeGrant, Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantsList } from "@/generated/grants/grants";
import { formatApiError } from "@/lib/formatApiError";
import { inOsloTime } from "@/lib/osloTime";
import { startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { formatOsloTime } from "@/lib/osloTime";
import { GrantCard, grantHref } from "./GrantCard";
import { LockBadge } from "./LockBadge";
import { ModeBadge } from "./ModeBadge";

/**
 * Airtime from the start of today on, in order. Members see their own
 * organization's grants; staff can look across organizations.
 */
export const GrantsBoard = ({
  organizationId,
  organizations,
}: {
  organizationId?: number;
  /** Given for staff, who can pick any organization or all of them. */
  organizations?: Organization[];
}) => {
  const [selected, setSelected] = useState(organizationId);
  // Fixed for the page's lifetime, so the query key doesn't change each render.
  const startsAfter = useMemo(() => startOfDay(inOsloTime(new Date())).toISOString(), []);
  const grants = useGrantsList({
    organization: selected,
    starts_after: startsAfter,
    limit: 200,
  });
  const results = grants.data?.data.results ?? [];
  // Lead with what the user can still act on. Locked lists and what has
  // aired are only for reference, so they fold away below, compact.
  const [now] = useState(Date.now);
  const aired = results.filter((grant) => Date.parse(grant.endtime) <= now);
  const upcoming = results.filter((grant) => Date.parse(grant.endtime) > now);
  const editable = upcoming.filter((grant) => grant.canEdit);
  const readOnly = upcoming.filter((grant) => !grant.canEdit);
  const showOrganization = selected === undefined;

  return (
    <section className="space-y-4">
      {organizations ? (
        <label className="flex max-w-sm flex-col gap-1 font-medium">
          Organisasjon
          <select
            className="rounded-lg border border-default-300 bg-background px-3 py-2"
            value={selected ?? ""}
            onChange={(event) =>
              setSelected(event.target.value ? Number(event.target.value) : undefined)
            }
          >
            <option value="">Alle</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {grants.isLoading ? <p>Laster sendetid…</p> : null}
      {grants.isError ? <p role="alert">{formatApiError(grants.error)}</p> : null}
      {grants.isSuccess && results.length === 0 ? (
        <p className="bg-background p-5">Ingen sendetid er tildelt ennå.</p>
      ) : null}

      {grants.isSuccess && results.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Kan settes opp ({editable.length})</h2>
          {editable.length === 0 ? (
            <p className="bg-background p-5">
              Ingen sendetid kan endres nå. Listene under er låst eller allerede sendt.
            </p>
          ) : (
            <>
              <p className="flex flex-wrap items-center gap-2 text-sm text-default-600">
                <ModeBadge automatic /> fyller seg selv rundt det dere velger, til et døgn før
                sending.
                <ModeBadge automatic={false} /> blir stående slik den ble lagret.
              </p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {editable.map((grant) => (
                  <GrantCard
                    grant={grant}
                    key={grant.id}
                    now={now}
                    showOrganization={showOrganization}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}

      <CompactGrants
        grants={readOnly}
        now={now}
        showOrganization={showOrganization}
        title="Låst, venter på sending"
      />
      <CompactGrants
        grants={aired}
        now={now}
        showOrganization={showOrganization}
        title="Allerede sendt i dag"
      />
    </section>
  );
};

/** Grants to look up rather than work on: one line each, folded away. */
const CompactGrants = ({
  grants,
  now,
  showOrganization,
  title,
}: {
  grants: AirtimeGrant[];
  now: number;
  showOrganization: boolean;
  title: string;
}) =>
  grants.length === 0 ? null : (
    <details className="bg-background p-4 text-sm text-default-600">
      <summary className="cursor-pointer font-semibold">
        {title} ({grants.length})
      </summary>
      <ul className="mt-2 divide-y divide-default-100">
        {grants.map((grant) => (
          <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5" key={grant.id}>
            <Link className="underline" href={grantHref(grant)}>
              <span className="first-letter:uppercase">
                {format(inOsloTime(grant.starttime), "EEEE d. MMMM", { locale: nb })}
              </span>{" "}
              {formatOsloTime(grant.starttime)}–{formatOsloTime(grant.endtime)}
            </Link>
            {showOrganization ? <span>{grant.organization.name}</span> : null}
            <span>
              {grant.items.length === 0
                ? "grafikk"
                : `${grant.items.length} ${grant.items.length === 1 ? "program" : "programmer"}`}
            </span>
            {Date.parse(grant.endtime) > now ? (
              <LockBadge className="ms-auto" grant={grant} now={now} />
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
