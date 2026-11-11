import { ButtonLink } from "@/components/ButtonLink";
import type { AirtimeGrant } from "@/generated/frikanalenDjangoAPI.schemas";
import { formatOsloTime, inOsloTime } from "@/lib/osloTime";
import cx from "classnames";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { FillBar } from "./FillBar";
import {
  deadlineText,
  isAutomatic,
  itemName,
  listMilliseconds,
  STATE_LABELS,
  timeline,
  windowMilliseconds,
} from "./grants";
import { LockBadge } from "./LockBadge";
import { ModeBadge, modeSurface } from "./ModeBadge";

/** How many entries a card lists before it says "and n more". */
const PREVIEW_ROWS = 4;

export const grantHref = (grant: Pick<AirtimeGrant, "id" | "organization">) =>
  `/organization/${grant.organization.id}/schedule/${grant.id}`;

export const GrantCard = ({
  grant,
  showOrganization = false,
  now,
}: {
  grant: AirtimeGrant;
  showOrganization?: boolean;
  /** The board's clock, so every card agrees on what has locked. */
  now: number;
}) => {
  const automatic = isAutomatic(grant);
  const cancelled = grant.state === "cancelled";
  const { rows, graphics } = timeline(grant.items, grant);

  return (
    <article
      className={cx(
        "space-y-3 rounded-xl p-4",
        cancelled ? "border-2 border-default-200 opacity-60" : modeSurface(automatic),
      )}
    >
      <header className="flex flex-wrap items-start gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold first-letter:uppercase">
            {format(inOsloTime(grant.starttime), "EEEE d. MMMM", { locale: nb })}{" "}
            {formatOsloTime(grant.starttime)}–{formatOsloTime(grant.endtime)}
          </h3>
          {showOrganization ? (
            <p className="text-sm text-default-600">{grant.organization.name}</p>
          ) : null}
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-1 text-xs">
          {cancelled ? null : <ModeBadge automatic={automatic} empty={rows.length === 0} />}
          {cancelled ? (
            <span className="rounded-full bg-default-100 px-2 py-0.5">
              {STATE_LABELS.cancelled}
            </span>
          ) : (
            <LockBadge grant={grant} now={now} />
          )}
        </div>
      </header>

      {/* The lock badge says when the list closes; only cancelled needs words. */}
      {cancelled ? <p className="text-sm text-default-600">{deadlineText(grant, "")}</p> : null}

      <FillBar
        automatic={automatic}
        used={listMilliseconds(grant.items)}
        window={windowMilliseconds(grant)}
      />

      {rows.length === 0 ? (
        <p className="text-sm">Ingenting er satt opp. Sendetiden viser grafikk.</p>
      ) : (
        <ol className="space-y-0.5 text-sm">
          {rows.slice(0, PREVIEW_ROWS).map((row, index) => (
            <li className="flex gap-2" key={`${row.item.video.id}-${index}`}>
              <span className="tabular-nums text-default-500">{formatOsloTime(row.start)}</span>
              <span className="truncate">
                {itemName(row.item)}
                {row.item.video.pendingUpload ? " (venter på fil)" : ""}
              </span>
            </li>
          ))}
          {rows.length > PREVIEW_ROWS ? (
            <li className="text-default-500">og {rows.length - PREVIEW_ROWS} til</li>
          ) : null}
          {graphics ? (
            <li className="flex gap-2 text-default-500">
              <span className="tabular-nums">{formatOsloTime(graphics.start)}</span>
              <span>Grafikk</span>
            </li>
          ) : null}
        </ol>
      )}

      {cancelled ? null : (
        <ButtonLink href={grantHref(grant)} size="sm">
          {grant.canEdit ? "Sett opp programmet" : "Se listen"}
        </ButtonLink>
      )}
    </article>
  );
};
