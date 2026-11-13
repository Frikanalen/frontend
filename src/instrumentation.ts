export async function register() {
  // Only in a running server: the build has no Django to listen to.
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build")
    return;
  const { listenForScheduleChanges } = await import("@/lib/scheduleChanges");
  listenForScheduleChanges();
}
