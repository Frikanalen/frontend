import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MetadataCurrentAndNext } from "./metadataCurrentAndNext";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";

// The start times below are Oslo's, so the suite runs somewhere else on
// purpose - the same premise as the phase tests. Pinned to Oslo, "20:00" would
// come out right even if the component read the viewer's clock, which is how
// the times went on being local long after the phases were fixed.
const ORIGINAL_TZ = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/New_York";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

const program = (id: number, name: string, organization: string, from: string, to: string) =>
  ({
    id,
    defaultName: "",
    starttime: `2026-08-21T${from}:00+02:00`,
    endtime: `2026-08-21T${to}:00+02:00`,
    duration: "01:00:00",
    schedulereason: 3,
    displaceable: false,
    video: {
      id: id * 10,
      name,
      header: "",
      organization: { id, name: organization, description: "" },
      categories: [],
      files: [],
    },
  }) as ScheduleitemRead;

const onAir = program(1, "Nyhetssendingen", "Norsk Presse", "12:00", "13:00");
const later = program(2, "Kveldens konsert", "Musikklaget", "20:00", "21:00");
const earlier = program(3, "Morgensendingen", "Tidligforeningen", "09:00", "10:00");

const organizationLinks = () =>
  Array.from(document.querySelectorAll("a"))
    .map((anchor) => anchor.getAttribute("href"))
    .filter((href) => href?.startsWith("/organization/"));

beforeEach(() => {
  // Half past twelve in Oslo: on air during `onAir`, well clear of the others.
  // Left to the real clock, the fixtures would drift in and out of the cases
  // below as the day went on.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-21T12:30:00+02:00"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("MetadataCurrentAndNext", () => {
  it("runs in a timezone that would give a different answer", () => {
    // Guards the premise above: read locally, the 20:00 below reads 14:00 here.
    expect(new Date("2026-08-21T20:00:00+02:00").getHours()).not.toBe(20);
  });

  it("shows the program on air and the one coming up, on Oslo's clock", () => {
    render(<MetadataCurrentAndNext schedule={[onAir, later]} />);

    expect(screen.getByText("Nå:")).toBeDefined();
    expect(screen.getByText("Nyhetssendingen")).toBeDefined();
    expect(screen.getByText("20:00")).toBeDefined();
    expect(screen.getByText("Kveldens konsert")).toBeDefined();
    expect(organizationLinks()).toEqual(["/organization/1", "/organization/2"]);
  });

  // Regression: both slots used to render unconditionally, so an empty schedule
  // drew a bare "Nå:", two dangling "av" labels and two dead organization links.
  it("says so plainly when there is no schedule at all", () => {
    render(<MetadataCurrentAndNext schedule={[]} />);

    expect(screen.getByText(/Vi har ingen programinformasjon/)).toBeDefined();
    expect(screen.queryByText("Nå:")).toBeNull();
    expect(organizationLinks()).toEqual([]);
  });

  it("points at the schedule when it has nothing else to offer", () => {
    render(<MetadataCurrentAndNext schedule={[]} />);

    expect(screen.getByRole("link", { name: /Se sendeplanen/ }).getAttribute("href")).toBe(
      "/schedule",
    );
  });

  it("admits to a gap in the schedule while still naming what is coming up", () => {
    render(<MetadataCurrentAndNext schedule={[earlier, later]} />);

    expect(screen.getByText("Nå:")).toBeDefined();
    expect(screen.getByText("Ingen registrert sending.")).toBeDefined();
    expect(screen.getByText("Kveldens konsert")).toBeDefined();
    expect(organizationLinks()).toEqual(["/organization/2"]);
  });

  it("drops the upcoming row once the listing runs out", () => {
    render(<MetadataCurrentAndNext schedule={[onAir]} />);

    expect(screen.getByText("Nyhetssendingen")).toBeDefined();
    expect(organizationLinks()).toEqual(["/organization/1"]);
  });

  it("never links to an organization it doesn't have", () => {
    for (const schedule of [[], [onAir], [earlier, later], [onAir, later], [earlier]]) {
      render(<MetadataCurrentAndNext schedule={schedule} />);

      expect(organizationLinks()).not.toContain("/organization/undefined");
      cleanup();
    }
  });
});
