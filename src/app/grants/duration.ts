// Django's DurationField renders as "[D ]HH:MM:SS[.ffffff]". Video lengths
// carry fractions of a second, and they add up over a list, so keep them.
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

/** A length for people: "1:05:00" or "4:09", rounded down to the second. */
export const formatDuration = (milliseconds: number) => {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (part: number) => String(part).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};
