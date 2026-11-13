"use client";
import { parseDate } from "@internationalized/date";
import cx from "classnames";
import { DateField, DateInput, DateSegment, Label } from "react-aria-components";

/**
 * A calendar date written the Norwegian way (dd.mm.yyyy) whatever the
 * browser's locale; a native date input follows the browser. The value is
 * "YYYY-MM-DD", or "" while no date is set.
 */
export const DayField = ({
  label,
  value,
  onChange,
  min,
  isRequired,
  className,
}: {
  label: string;
  value: string;
  onChange: (_value: string) => void;
  /** The earliest date allowed, as "YYYY-MM-DD". */
  min?: string;
  isRequired?: boolean;
  className?: string;
}) => (
  <DateField
    className={cx("flex min-w-0 flex-col gap-1", className)}
    granularity="day"
    isRequired={isRequired}
    minValue={min ? parseDate(min) : undefined}
    shouldForceLeadingZeros
    value={value ? parseDate(value) : null}
    onChange={(date) => onChange(date ? date.toString() : "")}
  >
    <Label className="text-sm font-medium">{label}</Label>
    <DateInput className="flex rounded-lg border border-default-300 bg-background px-3 py-2 tabular-nums focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
      {(segment) => (
        <DateSegment
          className="rounded-sm px-0.5 outline-none focus:bg-accent focus:text-accent-foreground data-[placeholder]:text-default-500"
          segment={segment}
        />
      )}
    </DateInput>
  </DateField>
);
