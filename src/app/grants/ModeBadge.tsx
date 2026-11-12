import cx from "classnames";
import { GoPencil, GoSync } from "react-icons/go";

/**
 * Whether a grant's list fills itself or someone set it up by hand. The two
 * look different everywhere a grant appears, so nobody mistakes a list the
 * night job will keep rewriting for one that stays as they left it.
 */
export const ModeBadge = ({
  automatic,
  empty = false,
  className,
}: {
  automatic: boolean;
  /** A manual list with nothing in it: nobody set it up, so don't say they did. */
  empty?: boolean;
  className?: string;
}) =>
  !automatic && empty ? (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md bg-default-100 px-2 py-0.5 text-xs font-medium text-default-700",
        className,
      )}
    >
      Tom: viser grafikk
    </span>
  ) : automatic ? (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md bg-secondary-50 px-2 py-0.5 text-xs font-medium text-secondary-800",
        className,
      )}
    >
      <GoSync aria-hidden /> Automatisk fylt
    </span>
  ) : (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md bg-default-100 px-2 py-0.5 text-xs font-medium text-default-800",
        className,
      )}
    >
      <GoPencil aria-hidden /> Satt opp manuelt
    </span>
  );

/** Card and row styling that carries the same distinction as the badge. */
export const modeSurface = (automatic: boolean) =>
  automatic ? "border border-default-200 bg-content1" : "border border-default-200 bg-content1";
