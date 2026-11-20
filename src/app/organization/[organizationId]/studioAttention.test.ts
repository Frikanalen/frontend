import { describe, expect, it } from "vitest";
import { grantsNeedingProgramme } from "./studioAttention";

const now = Date.parse("2030-01-10T12:00:00Z");
const grant = (overrides: Record<string, unknown> = {}) => ({
  state: "open" as const,
  canEdit: true,
  recipe: null,
  items: [],
  locksAt: "2030-01-11T12:00:00Z",
  ...overrides,
});

describe("grantsNeedingProgramme", () => {
  it("counts an empty grant that locks within two days", () => {
    expect(grantsNeedingProgramme([grant()], now)).toBe(1);
  });

  it("leaves out grants that are set up, automatic, locked, read-only or far off", () => {
    expect(
      grantsNeedingProgramme(
        [
          grant({ items: [{}] }),
          grant({ recipe: { id: 1 } }),
          grant({ state: "locked" }),
          grant({ canEdit: false }),
          grant({ locksAt: "2030-01-20T12:00:00Z" }),
          grant({ locksAt: "2030-01-10T11:00:00Z" }),
        ] as never,
        now,
      ),
    ).toBe(0);
  });
});
