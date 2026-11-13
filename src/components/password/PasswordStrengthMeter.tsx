"use client";
import cx from "classnames";
import type { Score } from "@/components/password/strength";

const LABELS: Record<Score, string> = {
  0: "Veldig svakt",
  1: "Svakt",
  2: "Greit",
  3: "Sterkt",
  4: "Veldig sterkt",
};

const COLOURS: Record<Score, string> = {
  0: "bg-danger",
  1: "bg-danger",
  2: "bg-warning",
  3: "bg-success",
  4: "bg-success",
};

/** Four segments filled by score, with the verdict in words beside them. */
export const PasswordStrengthMeter = ({ score }: { score: Score | null }) => (
  <div className="flex items-center gap-3" aria-live="polite">
    <div className="flex grow gap-1" aria-hidden="true">
      {[1, 2, 3, 4].map((segment) => (
        <div
          key={segment}
          className={cx(
            "h-1.5 grow rounded-full transition-colors",
            score !== null && score >= segment ? COLOURS[score] : "bg-default-200",
          )}
        />
      ))}
    </div>
    <p className="text-foreground/75 w-24 shrink-0 text-right text-xs">
      {score === null ? "" : <>Styrke: {LABELS[score]}</>}
    </p>
  </div>
);
