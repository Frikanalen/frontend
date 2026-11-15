import cx from "classnames";
import { Fragment } from "react";
import { formatOsloTime } from "@/lib/osloTime";
import { formatDuration } from "./duration";
import { itemName, liveSourceName, type DraftItem, type TimelineRow } from "./grants";

/**
 * The grant's airtime drawn to scale: each programme as wide as it is long,
 * and whatever is left over as the graphics that will fill it. It says the
 * same as "35:00 of 1:00:00 used", but as a picture of the hour itself.
 *
 * A manual list is solid green, an automatic one plum and striped, as on the
 * cards. A live programme is the dark "stage" with the coral live dot.
 */
export const HourBar = <T extends DraftItem>({
  rows,
  start,
  end,
  used,
  automatic,
}: {
  rows: TimelineRow<T>[];
  start: string;
  end: string;
  /** From the grant's start to the end of the list, gaps between programmes
   * included, in milliseconds; it may exceed the window. */
  used: number;
  automatic: boolean;
}) => {
  const from = Date.parse(start);
  const window = Date.parse(end) - from;
  const over = used > window;
  const total = Math.max(window, used);
  const label = over
    ? `${formatDuration(used)} av ${formatDuration(window)}: ${formatDuration(used - window)} for mye`
    : `${formatDuration(used)} av ${formatDuration(window)} brukt, ${formatDuration(window - used)} grafikk til slutt`;
  const quarters = [0, 0.25, 0.5, 0.75, 1].map((part) => new Date(from + window * part));

  return (
    <div className="space-y-2">
      <div
        aria-hidden
        className="flex justify-between text-sm font-semibold text-default-600"
        // The marks belong to the window; a list that overruns pushes past them.
        style={{ width: `${(window / total) * 100}%` }}
      >
        {quarters.map((mark) => (
          <span key={mark.getTime()}>{formatOsloTime(mark)}</span>
        ))}
      </div>
      <div aria-label={label} className="flex h-12 gap-0.5 overflow-hidden" role="img">
        {rows.map((row, index) => {
          const length = row.end.getTime() - row.start.getTime();
          const live = !!liveSourceName(row.item.video);
          const poster = !!row.item.poster;
          const gap = row.gapBefore
            ? row.gapBefore.end.getTime() - row.gapBefore.start.getTime()
            : 0;
          return (
            <Fragment key={index}>
              {gap > 0 ? (
                <div
                  className="min-w-0 bg-default-200"
                  style={{ flex: `${gap} 1 0` }}
                  title="Grafikk"
                />
              ) : null}
              <div
                className={cx(
                  "flex min-w-0 items-center gap-2 overflow-hidden px-3 text-sm font-semibold whitespace-nowrap",
                  row.overruns
                    ? "bg-danger text-danger-foreground"
                    : live
                      ? "bg-stage text-stage-foreground"
                      : poster
                        ? "bg-brand-amber text-black"
                        : automatic
                          ? "bg-brand-plum bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgb(255_255_255/0.14)_6px_12px)] text-white"
                          : "bg-brand-green text-white",
                )}
                style={{ flex: `${Math.max(length, 0)} 1 0` }}
              >
                {live ? <span className="size-2 shrink-0 rounded-full bg-brand-coral" /> : null}
                <span className="truncate">{itemName(row.item)}</span>
              </div>
            </Fragment>
          );
        })}
        {!over && window > used ? (
          <div
            className="flex min-w-0 items-center overflow-hidden bg-default-200 px-3 text-sm whitespace-nowrap text-default-600"
            style={{ flex: `${window - used} 1 0` }}
          >
            <span className="truncate">Grafikk</span>
          </div>
        ) : null}
      </div>
      <p className={cx("text-sm", over ? "font-medium text-danger-700" : "text-default-600")}>
        {label}
      </p>
    </div>
  );
};
