"use client";
import { Time } from "@internationalized/date";
import cx from "classnames";
import { DateInput, DateSegment, Label, TimeField } from "react-aria-components";

/**
 * A time of day, always on the 24-hour clock whatever the browser's locale
 * (a native time input follows the browser and may show AM/PM). Each part is
 * typed or stepped with the arrow keys. The value is minutes after midnight.
 */
export const ClockField = ({
  label,
  hint,
  minutes,
  onChange,
  className,
}: {
  label: string;
  /** Shown after the label, such as "neste dag". */
  hint?: string | null;
  minutes: number;
  onChange: (_minutes: number) => void;
  className?: string;
}) => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return (
    <TimeField
      className={cx("flex min-w-0 flex-col gap-1", className)}
      granularity="minute"
      hourCycle={24}
      shouldForceLeadingZeros
      value={new Time(Math.floor(wrapped / 60), wrapped % 60)}
      onChange={(value) => {
        if (value) onChange(value.hour * 60 + value.minute);
      }}
    >
      <Label className="flex items-baseline justify-between gap-2 text-sm font-medium">
        {label}
        {hint ? <span className="text-xs font-normal text-default-600">{hint}</span> : null}
      </Label>
      <DateInput className="flex rounded-lg border border-default-300 bg-background px-3 py-2 text-lg font-semibold tabular-nums focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
        {(segment) => (
          <DateSegment
            className="rounded-sm px-0.5 outline-none focus:bg-accent focus:text-accent-foreground"
            segment={segment}
          />
        )}
      </DateInput>
    </TimeField>
  );
};
