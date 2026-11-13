/**
 * Tells cached schedule data when to go stale.
 *
 * Django pushes a nudge down /api/playout/events whenever the schedule
 * changes, the same stream playout and the on-air graphics follow. Each
 * frontend pod keeps one connection to it (started from instrumentation.ts)
 * and counts the nudges; cached schedule data takes the count as an argument,
 * so the next visitor after a change gets a fresh fetch. Every event counts,
 * including `hello` on connect, so whatever was missed while the stream was
 * down is refetched once it is back. Until then the schedule's own cache
 * lifetime still applies.
 *
 * The state lives on globalThis because instrumentation and the pages can be
 * separate bundles with their own copy of this module.
 */

const RECONNECT_MS = 5_000;
// Django sends a heartbeat every 15 seconds; this long without a byte means
// the connection is dead even if TCP hasn't noticed.
const READ_TIMEOUT_MS = 45_000;

type State = { generation: number; listening: boolean };
const KEY = Symbol.for("frikanalen.scheduleChanges");
const state = ((globalThis as Record<symbol, State | undefined>)[KEY] ??= {
  generation: 0,
  listening: false,
});

/** Moves whenever Django says the schedule changed. */
export const scheduleGeneration = () => String(state.generation);

const streamOnce = async (url: URL) => {
  const abort = new AbortController();
  let watchdog = setTimeout(() => abort.abort(), READ_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/event-stream" },
      signal: abort.signal,
      cache: "no-store",
    });
    if (!response.ok || !response.body) throw new Error(`the API answered ${response.status}`);

    const decoder = new TextDecoder();
    let buffered = "";
    for await (const chunk of response.body) {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => abort.abort(), READ_TIMEOUT_MS);
      buffered += decoder.decode(chunk, { stream: true });
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      if (lines.some((line) => line.startsWith("event:"))) state.generation += 1;
    }
  } finally {
    clearTimeout(watchdog);
  }
};

/** Follows the event stream for the life of the process. Idempotent. */
export const listenForScheduleChanges = () => {
  if (state.listening) return;
  state.listening = true;
  const url = new URL("api/playout/events", process.env.DJANGO_URL ?? "http://localhost:8000/");

  void (async () => {
    for (;;) {
      try {
        await streamOnce(url);
      } catch (error) {
        console.warn("Schedule change stream unavailable; relying on cache lifetimes", error);
      }
      await new Promise((resolve) => setTimeout(resolve, RECONNECT_MS));
    }
  })();
};
