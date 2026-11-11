"use client";
import type { Organization } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantsList } from "@/generated/grants/grants";
import { formatApiError } from "@/lib/formatApiError";
import { inOsloTime } from "@/lib/osloTime";
import { startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { GrantCard } from "./GrantCard";
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

      <p className="flex flex-wrap items-center gap-2 text-sm text-default-600">
        <ModeBadge automatic /> fylles hver natt frem til fristen.
        <ModeBadge automatic={false} /> blir stående slik den ble lagret.
      </p>

      {grants.isLoading ? <p>Laster sendetid…</p> : null}
      {grants.isError ? <p role="alert">{formatApiError(grants.error)}</p> : null}
      {grants.isSuccess && results.length === 0 ? (
        <p className="rounded-xl border border-default-200 bg-content1 p-4">
          Ingen sendetid er tildelt ennå.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {results.map((grant) => (
          <GrantCard grant={grant} key={grant.id} showOrganization={selected === undefined} />
        ))}
      </div>
    </section>
  );
};
