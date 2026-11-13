"use client";
import cx from "classnames";
import { ClockField } from "./ClockField";

const DAY = 24 * 60;
const PRESETS = [30, 60, 90, 120];

const lengthLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} t ${rest} min` : `${hours} t`;
};

/**
 * When a stretch of airtime starts and ends, to the minute. The length
 * follows from the two; the shortcuts set common lengths from the start
 * time. An end at or before the start is the next day, so a stretch is at
 * most 24 hours. Both values are minutes: `start` after midnight, and
 * `duration`.
 */
export const TimeRange = ({
  start,
  duration,
  onChange,
}: {
  start: number;
  duration: number;
  onChange: (_range: { start: number; duration: number }) => void;
}) => {
  const end = start + duration;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <ClockField
          label="Fra kl."
          minutes={start}
          onChange={(next) => onChange({ start: next, duration })}
        />
        <span aria-hidden className="pb-2.5 text-default-500">
          –
        </span>
        <ClockField
          hint={end > DAY ? "neste dag" : null}
          label="Til kl."
          minutes={end}
          onChange={(next) => onChange({ start, duration: ((next - start + DAY - 1) % DAY) + 1 })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="me-1 font-semibold tabular-nums" data-testid="time-range-length">
          {lengthLabel(duration)}
        </span>
        {PRESETS.map((minutes) => (
          <button
            aria-pressed={duration === minutes}
            className={cx(
              "border px-2 py-0.5",
              duration === minutes
                ? "border-accent bg-accent/10 font-semibold"
                : "border-default-300 text-default-700 hover:bg-default-100",
            )}
            key={minutes}
            type="button"
            onClick={() => onChange({ start, duration: minutes })}
          >
            {lengthLabel(minutes)}
          </button>
        ))}
      </div>
    </div>
  );
};
