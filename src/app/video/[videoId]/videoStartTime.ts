/**
 * Read the playback offset from the video's `t` query parameter.
 *
 * A duplicated or malformed value is ignored so an odd URL can never pass
 * NaN, Infinity, or a negative time to the media player.
 */
export const videoStartTimeFrom = (value: string | string[] | undefined): number | undefined => {
  if (typeof value !== "string" || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return undefined;

  const seconds = Number(value);
  return Number.isFinite(seconds) ? seconds : undefined;
};
