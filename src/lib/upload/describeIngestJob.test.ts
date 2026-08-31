import { describe, expect, it } from "vitest";
import { IngestStateEnum, type IngestJob } from "@/generated/frikanalenDjangoAPI.schemas";
import { describeIngestJob, ingestIsSettled, STALE_AFTER_MS } from "@/lib/upload/describeIngestJob";

const NOW = new Date("2026-08-18T12:00:00Z").getTime();

const job = (overrides: Partial<IngestJob> = {}): IngestJob => ({
  video: 1,
  state: IngestStateEnum.transcoding,
  claimedBy: null,
  percentageDone: 50,
  updatedTime: new Date(NOW).toISOString(),
  ...overrides,
});

describe("describeIngestJob", () => {
  it("reports progress within the current step", () => {
    const description = describeIngestJob(job({ percentageDone: 50 }), NOW);

    expect(description.phase).toBe("working");
    expect(description.percentage).toBe(50);
  });

  it("reports no percentage for a step that has nothing to count", () => {
    // Probing and archiving know only that they are running; the UI turns
    // this into an indeterminate bar rather than one frozen at zero.
    const description = describeIngestJob(
      job({ state: IngestStateEnum.probing, percentageDone: null }),
      NOW,
    );

    expect(description.phase).toBe("working");
    expect(description.percentage).toBeNull();
  });

  it("turns a known error code into something the uploader can act on", () => {
    const description = describeIngestJob(
      job({ state: IngestStateEnum.failed, errorCode: "not_compliant" }),
      NOW,
    );

    expect(description.phase).toBe("failed");
    expect(description.message).toContain("MP4");
  });

  it("still says a failure happened when the code is one we do not know", () => {
    const description = describeIngestJob(
      job({ state: IngestStateEnum.failed, errorCode: "some_code_from_the_future" }),
      NOW,
    );

    expect(description.phase).toBe("failed");
    expect(description.message).not.toContain("some_code_from_the_future");
    expect(description.message.length).toBeGreaterThan(0);
  });

  it("never shows a percentage for a failure", () => {
    const description = describeIngestJob(
      job({ state: IngestStateEnum.failed, errorCode: "transcode_failed", percentageDone: 40 }),
      NOW,
    );

    expect(description.percentage).toBeNull();
  });

  it("calls a job stalled once nothing has been reported for too long", () => {
    // Nothing cancels a job whose process died, so an old `transcoding` is
    // the shape an abandoned ingest takes.
    const stale = job({ updatedTime: new Date(NOW - STALE_AFTER_MS - 1000).toISOString() });

    expect(describeIngestJob(stale, NOW).phase).toBe("stalled");
  });

  it("does not call a queued job stalled, however long it has been queued", () => {
    const queued = job({
      state: IngestStateEnum.pending,
      updatedTime: new Date(NOW - STALE_AFTER_MS * 10).toISOString(),
    });

    expect(describeIngestJob(queued, NOW).phase).toBe("waiting");
  });

  it("does not blame the new file for the verdict on the one it replaced", () => {
    // A video has one ingest job. Choosing another file after a failure leaves
    // that failure in place until ingest gets to the replacement, and showing
    // it again would fail an upload nobody has looked at yet.
    const failed = job({
      state: IngestStateEnum.failed,
      errorCode: "not_compliant",
      updatedTime: new Date(NOW - 60_000).toISOString(),
    });

    const description = describeIngestJob(failed, NOW, failed.updatedTime);

    expect(description.phase).toBe("waiting");
    expect(description.message).not.toContain("MP4");
  });

  it("says what ingest says as soon as it has reported on the new file", () => {
    const reported = job({ state: IngestStateEnum.failed, errorCode: "not_compliant" });

    const description = describeIngestJob(reported, NOW, new Date(NOW - 60_000).toISOString());

    expect(description.phase).toBe("failed");
    expect(description.message).toContain("MP4");
  });

  it("counts never having reported as a report of its own", () => {
    // Nothing had been uploaded when the replaced file was chosen, so the job
    // carried no timestamp; it is still the report being replaced.
    const untouched = job({ state: IngestStateEnum.done, updatedTime: null });

    expect(describeIngestJob(untouched, NOW, null).phase).toBe("waiting");
    expect(describeIngestJob(untouched, NOW).phase).toBe("done");
  });

  it("treats a finished job as finished no matter how long ago it finished", () => {
    const old = job({
      state: IngestStateEnum.done,
      updatedTime: new Date(NOW - STALE_AFTER_MS * 100).toISOString(),
    });

    expect(describeIngestJob(old, NOW).phase).toBe("done");
    expect(describeIngestJob(old, NOW).percentage).toBe(100);
  });
});

describe("ingestIsSettled", () => {
  it("stops polling once the job is done or failed", () => {
    expect(ingestIsSettled(describeIngestJob(job({ state: IngestStateEnum.done }), NOW))).toBe(
      true,
    );
    expect(ingestIsSettled(describeIngestJob(job({ state: IngestStateEnum.failed }), NOW))).toBe(
      true,
    );
  });

  it("keeps polling through a verdict that belongs to a replaced file", () => {
    // Stopping here would leave the replacement uploaded and unwatched, and
    // the uploader on a page that never moves on.
    const failed = job({ state: IngestStateEnum.failed, errorCode: "not_compliant" });

    expect(ingestIsSettled(describeIngestJob(failed, NOW, failed.updatedTime))).toBe(false);
  });

  it("keeps polling while work is still happening, and while it looks stuck", () => {
    expect(ingestIsSettled(describeIngestJob(job(), NOW))).toBe(false);

    const stale = job({ updatedTime: new Date(NOW - STALE_AFTER_MS - 1000).toISOString() });
    // A stalled job may yet recover; the uploader is warned, not redirected.
    expect(ingestIsSettled(describeIngestJob(stale, NOW))).toBe(false);
  });
});
