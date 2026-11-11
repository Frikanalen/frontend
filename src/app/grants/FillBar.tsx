import { formatDuration } from "./duration";

/**
 * How much of a grant's window its list uses. Whatever is left airs as
 * broadcast graphics; a list longer than the window can't be saved. An
 * automatic list is drawn striped, a manual one solid, as on the cards.
 */
export const FillBar = ({
  used,
  window,
  automatic = false,
}: {
  used: number;
  window: number;
  automatic?: boolean;
}) => {
  const over = used > window;
  const percent = window > 0 ? Math.min(100, (used / window) * 100) : 0;
  const label = over
    ? `${formatDuration(used)} av ${formatDuration(window)}: ${formatDuration(used - window)} for mye`
    : `${formatDuration(used)} av ${formatDuration(window)} brukt, ${formatDuration(window - used)} grafikk`;
  const fill = automatic
    ? "bg-secondary-500 bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgb(255_255_255/0.35)_6px_12px)]"
    : "bg-success-500";

  return (
    <div className="space-y-1">
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(percent)}
        className="h-3 w-full overflow-hidden rounded-full bg-default-200"
        role="progressbar"
      >
        {over ? (
          // The window is the green or blue part; what doesn't fit is red.
          <div className="flex h-full">
            <div
              className={automatic ? "bg-secondary-500" : "bg-success-500"}
              style={{ width: `${(window / used) * 100}%` }}
            />
            <div className="grow bg-danger-500" />
          </div>
        ) : (
          <div className={`h-full ${fill}`} style={{ width: `${percent}%` }} />
        )}
      </div>
      <p className={`text-sm ${over ? "font-medium text-danger-700" : "text-default-600"}`}>
        {label}
      </p>
    </div>
  );
};
