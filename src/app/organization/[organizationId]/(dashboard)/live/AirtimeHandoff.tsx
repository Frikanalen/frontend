"use client";
import type { LiveSource } from "@/generated/frikanalenDjangoAPI.schemas";
import { useGrantsList } from "@/generated/grants/grants";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import Link from "next/link";
import { useState } from "react";

/**
 * The last step of going live: a source is only a signal until it has a
 * place in the schedule. Lists the organization's coming airtime that can
 * still be changed, each a link that opens it with a new live broadcast from
 * this source ready to fill in; with none, the way to ask for airtime.
 */
export const AirtimeHandoff = ({
  organizationId,
  source,
}: {
  organizationId: number;
  source: Pick<LiveSource, "id" | "name">;
}) => {
  const [now] = useState(() => new Date().toISOString());
  const grants = useGrantsList({
    organization: organizationId,
    starts_after: now,
    ordering: "starttime",
    limit: 20,
  });
  const open = (grants.data?.data.results ?? []).filter((grant) => grant.canEdit).slice(0, 4);
  const base = `/organization/${organizationId}/schedule`;

  return (
    <section aria-labelledby="handoff-heading" className="space-y-3">
      <h3 className="font-semibold" id="handoff-heading">
        Sett den i sendeplanen
      </h3>
      <p className="text-sm text-default-600">
        Kilden går på lufta når en direktesending fra den står i sendetiden deres. Velg en sendetid,
        så får du opp skjemaet med «{source.name}» valgt.
      </p>
      {grants.isLoading ? <p className="text-sm">Laster sendetid…</p> : null}
      {open.length > 0 ? (
        <ul className="border-t border-default-200">
          {open.map((grant) => (
            <li
              className="flex flex-wrap items-center justify-between gap-2 border-b border-default-200 py-2"
              key={grant.id}
            >
              <span className="font-medium first-letter:uppercase">
                {format(inOsloTime(grant.starttime), "EEEE d. MMMM", { locale: nb })}{" "}
                {formatOsloTime(grant.starttime)}–{formatOsloTime(grant.endtime)}
              </span>
              <Link
                className="text-sm font-semibold text-link hover:underline"
                href={`${base}/${grant.id}?direkte=${source.id}`}
              >
                Legg direktesendingen her →
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {!grants.isLoading && open.length === 0 ? (
        <p className="text-sm">Dere har ingen kommende sendetid som kan endres.</p>
      ) : null}
      <p className="text-sm">
        <Link className="font-semibold text-link hover:underline" href={`${base}/request?engang=1`}>
          Be om sendetid til en direktesending →
        </Link>
      </p>
    </section>
  );
};
