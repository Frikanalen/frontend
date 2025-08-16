import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

const readHash = () => (typeof window === "undefined" ? "" : window.location.hash.slice(1)); // "3" from "#3"

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

/**
 * Map a Date to a phase:
 * 0 = morning  [06:00, 12:00]
 * 1 = day      [12:00, 18:00]
 * 2 = evening  [18:00, 24:00]
 * 3 = night    [00:00, 06:00]
 */
export type Phase = 0 | 1 | 2 | 3;

export function phaseOf(date: Date): Phase {
  const h = date.getHours(); // 0–23
  const bucket = Math.floor(h / 6);
  // bucket order is [night, morning, day, evening]
  const remap: Phase[] = [3, 0, 1, 2];
  return remap[bucket];
}

/**
 * Stores the phase of day (p0-p4) in the URL hash.
 *
 */
export const useDatePhaseInHash = () => {
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const defaultPhaseRef = useRef<Phase>(phaseOf(new Date()));
  const phase: Phase = useMemo(() => parsePhase(hash) ?? defaultPhaseRef.current, [hash]);
  // reflect the default phase into the URL once, keeping history clean.
  useEffect(() => {
    if (hash === "") setPhase(defaultPhaseRef.current, { replace: true });
  }, [hash]);

  return [phase, setPhase] as const;
};

function parsePhase(h: string): 0 | 1 | 2 | 3 | null {
  if (h.length === 2 && h[0] === "p") {
    const n = h.charCodeAt(1) - 48;
    return n >= 0 && n <= 3 ? (n as 0 | 1 | 2 | 3) : null;
  }
  return null;
}

function setPhase(p: 0 | 1 | 2 | 3, { replace = true } = {}) {
  const url = new URL(window.location.href);
  url.hash = `#p${p}`;
  if (replace) history.replaceState(history.state, "", url);
  else history.pushState(history.state, "", url);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
