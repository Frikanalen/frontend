import cx from "classnames";
import Link from "next/link";
import { GoCheck } from "react-icons/go";
import type { OnboardingStep, StepState } from "./steps";

const STATE_LABELS: Record<StepState, string | null> = {
  done: "Ferdig",
  todo: "Deres tur",
  waiting: "Venter på Frikanalen",
  blocked: "Senere",
};

const STATE_BADGES: Record<StepState, string> = {
  done: "bg-success-50 text-success-800",
  todo: "bg-accent text-accent-foreground",
  waiting: "bg-warning-50 text-warning-800",
  blocked: "bg-default-100 text-default-600",
};

/**
 * The onboarding steps as a numbered list that says, for each one, whether it
 * is done and whose move it is. With `compact`, only titles: the list as a
 * map of the road, beside a form that is one of its steps.
 */
export const OnboardingSteps = ({
  steps,
  compact = false,
  current,
}: {
  steps: readonly OnboardingStep[];
  compact?: boolean;
  /** The step the surrounding page is about, marked in the compact list. */
  current?: OnboardingStep["id"];
}) => (
  <ol className={cx(compact ? "space-y-3" : "border-t border-foreground")}>
    {steps.map((step, index) => {
      const done = step.state === "done";
      const muted = step.state === "blocked";
      const isCurrent = current === step.id;
      return (
        <li
          aria-current={isCurrent ? "step" : undefined}
          className={cx(
            "flex gap-4",
            compact ? "items-center" : "border-b border-default-200 py-5",
            muted && !isCurrent && "text-default-500",
          )}
          key={step.id}
        >
          <span
            aria-hidden
            className={cx(
              "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              done
                ? "bg-brand-green text-white"
                : isCurrent || step.state === "todo"
                  ? "bg-stage text-stage-foreground"
                  : "border border-default-300",
            )}
          >
            {done ? <GoCheck /> : index + 1}
          </span>
          {compact ? (
            <span className={cx(isCurrent && "font-bold")}>
              {step.title}
              {done ? <span className="sr-only"> (ferdig)</span> : null}
            </span>
          ) : (
            <div className="min-w-0 grow">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="text-lg font-bold">{step.title}</h2>
                <span
                  className={cx(
                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                    STATE_BADGES[step.state],
                  )}
                >
                  {STATE_LABELS[step.state]}
                </span>
              </div>
              <p className={cx("mt-1 max-w-2xl", !muted && "text-default-700")}>{step.text}</p>
              {step.actions.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {step.actions.map(({ href, label }, actionIndex) =>
                    step.state === "todo" && actionIndex === 0 ? (
                      <Link
                        className="inline-flex h-10 items-center rounded-md bg-accent px-4 font-semibold text-accent-foreground hover:opacity-90"
                        href={href}
                        key={href}
                      >
                        {label}
                      </Link>
                    ) : (
                      <Link
                        className="font-semibold text-link hover:underline"
                        href={href}
                        key={href}
                      >
                        {label} →
                      </Link>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          )}
        </li>
      );
    })}
  </ol>
);
