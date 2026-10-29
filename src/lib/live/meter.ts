/**
 * Level meter arithmetic: a sample peak in dBFS, shown on a scale from
 * FLOOR_DB to 0 with a broadcast-style fast attack and slow fall, so a
 * member watching it sees a level that moves with the sound but can be read.
 */

export const FLOOR_DB = -60;
// dB per second the shown level may fall; it rises instantly.
const FALL_DB_PER_SECOND = 20;
// How long the peak marker holds before it, too, falls.
export const PEAK_HOLD_MS = 1500;

/** The largest absolute sample, in dBFS, never below the floor. */
export function peakDb(samples: Float32Array): number {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  return peak > 0 ? Math.max(FLOOR_DB, 20 * Math.log10(peak)) : FLOOR_DB;
}

/** The level to show next, given the one shown and the one just measured. */
export function ballistics(shown: number, measured: number, elapsedMs: number): number {
  if (measured >= shown) return measured;
  return Math.max(measured, shown - (FALL_DB_PER_SECOND * elapsedMs) / 1000);
}

/** 0..1 along the meter for a level in dBFS. */
export const meterFraction = (db: number) => Math.min(1, Math.max(0, (db - FLOOR_DB) / -FLOOR_DB));
