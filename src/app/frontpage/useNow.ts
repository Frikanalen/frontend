import { useState } from "react";
import { useHarmonicIntervalFn } from "react-use";

/**
 * The viewer's clock as epoch milliseconds, refreshed every `everyMs`. The
 * harmonic interval fires every user of the same delay together, so the
 * listing beside the player and the strip below it never disagree.
 */
export const useNow = (everyMs = 15_000) => {
  const [now, setNow] = useState(() => Date.now());
  useHarmonicIntervalFn(() => setNow(Date.now()), everyMs);
  return now;
};
