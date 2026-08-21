// Django DurationField renders sub-second video lengths as HH:MM:SS.ffffff.
// Keep those values intact: rounding them creates small gaps or overlaps in airtime.
export const DURATION_PATTERN = "[0-9]+:[0-5][0-9]:[0-5][0-9](\\.[0-9]{1,6})?";

export const isScheduleDuration = (value: string) =>
  new RegExp(`^${DURATION_PATTERN}$`).test(value);

const API_DURATION_PATTERN = /^(?:(\d+) )?(\d+):([0-5]\d):([0-5]\d)(?:\.(\d{1,6}))?$/;

export const durationMilliseconds = (value: string) => {
  const match = API_DURATION_PATTERN.exec(value);
  if (!match) return undefined;

  const [, days = "0", hours, minutes, seconds, fraction = ""] = match;
  const milliseconds = Number(fraction.padEnd(3, "0").slice(0, 3));
  return (
    ((Number(days) * 24 + Number(hours)) * 3600 + Number(minutes) * 60 + Number(seconds)) * 1000 +
    milliseconds
  );
};
