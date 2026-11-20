import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ScheduleItemList } from "./ScheduleItemView";
import { ScheduleitemRead } from "@/generated/frikanalenDjangoAPI.schemas";

// Oslo start times, read somewhere else on purpose: the labels must be Oslo
// time whatever the viewer's clock says. Pinned to Oslo this file would pass
// either way.
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
    defaultName: "",
    starttime: `2026-08-21T${from}:00+02:00`,
    endtime: `2026-08-21T${from}:00+02:00`,
    duration: "01:00:00",
    schedulereason: 3,
    grant: null,
    isLive: false,
    liveSource: null,
    video: {
      id: id * 10,
      name,
      description: `${name} — programbeskrivelse`,
      organization: { id, name: "Norsk Presse", description: "" },
      categories: [],
      files: [],
    },
  }) as ScheduleitemRead;

const evening = program(1, "Kveldens konsert", "20:00");
const smallHours = program(2, "Nattsending", "00:30");

afterEach(cleanup);

describe("ScheduleItemList", () => {
  it("runs in a timezone that would give a different answer", () => {
    expect(new Date("2026-08-21T20:00:00+02:00").getHours()).not.toBe(20);
  });

  it("labels a program with its Oslo start time", () => {
    render(<ScheduleItemList items={[evening]} />);

    expect(screen.getByText("20:00")).toBeDefined();
    expect(screen.getByText("Kveldens konsert")).toBeDefined();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Kveldens konsert — programbeskrivelse")).toBeDefined();
  });

  it("lists the whole day in start order, small hours first", () => {
    // 00:30 Oslo is 18:30 the previous evening in New York: read locally this
    // row would say 18:30.
    render(<ScheduleItemList items={[evening, smallHours]} />);

    expect(screen.getByText("00:30")).toBeDefined();
    const names = screen.getAllByRole("link", { name: /Kveldens konsert|Nattsending/ });
    expect(names.map((a) => a.textContent)).toEqual(["Nattsending", "Kveldens konsert"]);
  });

  it("renders a named programme without a video", () => {
    render(
      <ScheduleItemList
        items={[
          {
            ...evening,
            id: 3,
            defaultName: "Direktesending",
            video: null,
          },
        ]}
      />,
    );

    expect(screen.getByText("Direktesending")).toBeDefined();
    expect(screen.queryByText("Presentert av")).toBeNull();
  });

  it("groups programmes under the organization whose airtime it is", () => {
    const grant = {
      id: 7,
      organization: { id: 1, name: "Norsk Presse", fkmember: true },
      starttime: "2026-08-21T20:00:00+02:00",
      endtime: "2026-08-21T21:00:00+02:00",
      station: false,
    };
    const by = (item: ScheduleitemRead, name: string, grant: number | null) =>
      ({
        ...item,
        grant,
        video: { ...item.video, organization: { id: item.id, name, description: "" } },
      }) as ScheduleitemRead;
    render(
      <ScheduleItemList
        items={[
          { ...evening, grant: 7 },
          by(program(4, "Gjestespill", "20:30"), "Havneforeningen", 7),
          by(smallHours, "Frikanalen", null),
        ]}
        grants={[
          grant,
          { ...grant, id: 8, organization: { id: 9, name: "Sjakklubben", fkmember: true } },
        ]}
      />,
    );

    const heading = screen.getByRole("heading", { name: /Norsk Presse/ });
    expect(heading.closest("section")!.textContent).toContain("20:00–21:00");
    // Its own programme does not repeat the name; a guest's names its maker.
    expect(screen.getAllByText("Norsk Presse")).toHaveLength(1);
    expect(screen.getByText("Havneforeningen")).toBeDefined();
    // Outside any grant, and a grant that passed with nothing in it.
    expect(screen.getByRole("heading", { name: "Fra Frikanalen" })).toBeDefined();
    expect(screen.getByText("Sendetiden ble ikke brukt.")).toBeDefined();
  });
});
