import { formatDuration } from "./duration";

/**
 * How much of a grant's window its list uses. Whatever is left airs as
 * broadcast graphics; a list longer than the window can't be saved.
 */
export const FillBar = ({ used, window }: { used: number; window: number }) => {
  const over = used > window;
  const percent = window > 0 ? Math.min(100, (used / window) * 100) : 0;
  const label = over
    ? `${formatDuration(used)} av ${formatDuration(window)}: ${formatDuration(used - window)} for mye`
    : `${formatDuration(used)} av ${formatDuration(window)} brukt, ${formatDuration(window - used)} grafikk`;

  return (
    <div className="space-y-1">
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(percent)}
        className="h-2 w-full overflow-hidden rounded-full bg-default-200"
        role="progressbar"
      >
        <div
          className={`h-full ${over ? "bg-danger-500" : "bg-success-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={`text-sm ${over ? "text-danger-700" : "text-default-600"}`}>{label}</p>
    </div>
  );
};
