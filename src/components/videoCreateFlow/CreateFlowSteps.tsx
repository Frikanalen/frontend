import cx from "classnames";

const STEPS = [
  { key: "details", label: "Detaljer" },
  { key: "upload", label: "Last opp" },
] as const;

export const CreateFlowSteps = ({ current }: { current: (typeof STEPS)[number]["key"] }) => (
  <ol className="flex items-center gap-2 text-sm text-foreground-500">
    {STEPS.map((step, index) => {
      const isCurrent = step.key === current;
      return (
        <li key={step.key} className="flex items-center gap-2">
          <span
            className={cx(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
              isCurrent
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-foreground-300",
            )}
          >
            {index + 1}
          </span>
          <span className={cx(isCurrent && "font-medium text-foreground")}>{step.label}</span>
          {index < STEPS.length - 1 && <span className="mx-1 text-foreground-300">&rarr;</span>}
        </li>
      );
    })}
  </ol>
);
