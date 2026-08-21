import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ScheduleItemList } from "./ScheduleItemView";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";

// Oslo start times, read somewhere else on purpose - see the note in
// useDatePhaseInHash.test.ts. Pinned to Oslo this file would pass either way.
const ORIGINAL_TZ = process.env.TZ;

beforeAll(() => {
  process.env.TZ = "America/New_York";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

const program = (id: number, name: string, from: string) =>
  ({
    id,
    starttime: `2026-08-21T${from}:00+02:00`,
    endtime: `2026-08-21T${from}:00+02:00`,
    displaceable: false,
    video: {
      id: id * 10,
      name,
      header: "",
      organization: { id, name: "Norsk Presse", description: "" },
      categories: [],
      files: [],
    },
  }) as ScheduleitemRead;

const evening = program(1, "Kveldens konsert", "20:00");
const smallHours = program(2, "Nattsending", "00:30");

// The tab in view is the phase in the URL hash, which is what the list filters on.
const showTab = (phase: number) => {
  window.location.hash = `#p${phase}`;
};

afterEach(cleanup);

describe("ScheduleItemList", () => {
  it("runs in a timezone that would give a different answer", () => {
    expect(new Date("2026-08-21T20:00:00+02:00").getHours()).not.toBe(20);
  });

  it("labels a program with its Oslo start time", () => {
    showTab(2);
    render(<ScheduleItemList items={[evening]} />);

    expect(screen.getByText("20:00")).toBeDefined();
    expect(screen.getByText("Kveldens konsert")).toBeDefined();
  });

  it("keeps a small-hours program in Natt, labelled as such", () => {
    // 00:30 Oslo is 18:30 the previous evening in New York: read locally this
    // row would say 18:30 and sit under Kveld instead.
    showTab(3);
    render(<ScheduleItemList items={[evening, smallHours]} />);

    expect(screen.getByText("00:30")).toBeDefined();
    expect(screen.getByText("Nattsending")).toBeDefined();
    expect(screen.queryByText("Kveldens konsert")).toBeNull();
  });
});
