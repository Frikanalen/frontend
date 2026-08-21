// Django DurationField renders sub-second video lengths as HH:MM:SS.ffffff.
// Keep those values intact: rounding them creates small gaps or overlaps in airtime.
export const DURATION_PATTERN = "[0-9]+:[0-5][0-9]:[0-5][0-9](\\.[0-9]{1,6})?";

export const isScheduleDuration = (value: string) =>
  new RegExp(`^${DURATION_PATTERN}$`).test(value);
