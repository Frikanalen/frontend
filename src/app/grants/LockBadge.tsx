import type { AirtimeGrant } from "@/generated/frikanalenDjangoAPI.schemas";
import { inOsloTime } from "@/lib/osloTime";
import cx from "classnames";
import { format } from "date-fns";
import { nb } from "date-fns/locale/nb";
import { GoLock, GoUnlock } from "react-icons/go";
import { isLocked } from "./grants";

const shortDateTime = (instant: string) =>
  format(inOsloTime(instant), "EEE d. MMM 'kl.' HH:mm", { locale: nb });

/**
 * Whether the list is still open, and when it locks or locked. A locked
 * grant is drawn solid and dark with a padlock, so it stands apart from
 * the open ones at a glance.
 */
export const LockBadge = ({
  grant,
  now,
  className,
}: {
  grant: Pick<AirtimeGrant, "state" | "lockExempt" | "locksAt">;
  now: number;
  className?: string;
}) => {
  if (grant.state === "cancelled") return null;
  const base = "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium";
  if (grant.lockExempt)
    return (
      <span className={cx(base, "bg-secondary-50 text-secondary-700", className)}>
        <GoUnlock aria-hidden /> Unntatt fra låsing
      </span>
    );
  if (isLocked(grant, now))
    return (
      <span className={cx(base, "bg-foreground text-background", className)}>
        <GoLock aria-hidden /> Låst {shortDateTime(grant.locksAt)}
      </span>
    );
  return (
    <span className={cx(base, "bg-warning-50 text-warning-800", className)}>
      <GoUnlock aria-hidden /> Åpen til {shortDateTime(grant.locksAt)}
    </span>
  );
};
