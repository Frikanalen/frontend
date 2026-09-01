import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IngestStateEnum, type IngestJob } from "@/generated/frikanalenDjangoAPI.schemas";
import { IngestStatusChip } from "./IngestStatusChip";

const api = vi.hoisted(() => ({
  job: undefined as IngestJob | undefined,
  isError: false,
}));

vi.mock("@/generated/videos/videos", () => ({
  useVideosIngestRetrieve: () => ({
    data: api.job ? { data: api.job } : undefined,
    isError: api.isError,
  }),
}));

vi.mock("@heroui/react", () => ({
  Chip: ({ children }: { children: ReactNode }) => <span data-testid="chip">{children}</span>,
}));

const job = (overrides: Partial<IngestJob> = {}): IngestJob => ({
  video: 42,
  state: IngestStateEnum.transcoding,
  claimedBy: "worker-1",
  percentageDone: 40,
  updatedTime: new Date().toISOString(),
  ...overrides,
});

const chip = () => screen.getByTestId("chip").textContent;

beforeEach(() => {
  api.job = undefined;
  api.isError = false;
});

afterEach(() => {
  cleanup();
});

describe("IngestStatusChip", () => {
  it("says a running job is running rather than calling it a failure", () => {
    api.job = job();
    render(<IngestStatusChip videoId={42} />);

    expect(chip()).toBe("Lager visningskopier... (40 %)");
  });

  it("leaves out a percentage the current step cannot report", () => {
    api.job = job({ state: IngestStateEnum.probing, percentageDone: null });
    render(<IngestStatusChip videoId={42} />);

    expect(chip()).toBe("Analyserer originalfil...");
  });

  it("gives the uploader's own words for a failure", () => {
    api.job = job({ state: IngestStateEnum.failed, errorCode: "not_compliant" });
    render(<IngestStatusChip videoId={42} />);

    expect(chip()).toContain("Filformatet kan ikke sendes i kanalen");
  });

  it("does not claim a queue for a video ingest has never touched", () => {
    api.job = job({ state: IngestStateEnum.pending, updatedTime: null });
    render(<IngestStatusChip videoId={42} />);

    expect(chip()).toBe("Ingen behandling er startet.");
  });

  it("says nothing at all when the ingest state cannot be read", () => {
    api.isError = true;
    const { container } = render(<IngestStatusChip videoId={42} />);

    expect(container.innerHTML).toBe("");
  });
});
