import { describe, expect, it } from "vitest";
import snapshot from "./__fixtures__/snapshot.json";
import libzvbi from "./__fixtures__/libzvbi-cells.json";
import { g2 } from "./charset";
import { decodeBase64, decodePage, unham84 } from "./decode";
import { render, WIDTH, HEIGHT } from "./render";
import { buildScreen, clockText, headerRow } from "./screen";
import { TeletextStore } from "./store";

// The fixtures are real ttxd output: snapshot.json is its public feed with page 100 from
// the page generator (Level 2.5 palette, DRCS logo on page 10F, fastext) and test pages
// 200 (Level 1 attributes) and 201 (X/26 enhancements). libzvbi-cells.json is what
// libzvbi, an independent decoder, makes of the same pages, dumped with
// scripts/teletext-t42cells.c from ttxd's T42 debug stream. Each row is a list of runs
// [unicode, foreground, background, size, count].

const store = new TeletextStore("unused");
for (const p of snapshot.pages) {
  store.pages.set(parseInt(p.page, 16), {
    cycleSecs: p.cycle_secs,
    expires: null,
    subpages: p.subpages.map((s) => decodePage(decodeBase64(s))!),
  });
}

// libzvbi puts block mosaics at U+EE20-EE7F (contiguous) and U+EF20 (separated), as the
// character code; DRCS characters at U+F000 and up.
const libzvbiChar = (u: number) => {
  if (u >= 0xf000) return "DRCS";
  if (u >= 0xee00 && u < 0xf000) {
    const pattern = (u & 0x1f) | ((u & 0x40) >> 1);
    return pattern ? `M${pattern}` : " ";
  }
  return String.fromCodePoint(u);
};

describe("teletext decoder", () => {
  it("decodes Hamming 8/4 and corrects one bit", () => {
    expect(unham84(0x15)).toBe(0);
    expect(unham84(0xea)).toBe(15);
    expect(unham84(0xea ^ 0x04)).toBe(15);
  });

  it("has a full Latin G2 table", () => {
    expect(g2(0x61)).toBe("Æ");
    expect(g2(0x69)).toBe("Ø");
    expect(g2(0x79)).toBe("ø");
    expect(g2(0x7f)).toBe("■");
  });

  it("reads the page header and fastext links", () => {
    const page = store.page(0x100)!.subpages[0];
    expect(page.magazine).toBe(1);
    expect(page.page).toBe(0x00);
    expect(page.national).toBe(2);
    expect(page.fastext[0]?.page).toBe(0x888);
  });

  it("hides DRCS pages", () => {
    expect(store.page(0x10f)).toBeNull();
  });

  for (const [name, rows] of Object.entries(libzvbi)) {
    it(`draws page ${name} as libzvbi does`, () => {
      const page = store.page(parseInt(name, 16))!.subpages[0];
      const screen = buildScreen(store, page, headerRow(page.header, "P" + name, new Date()));
      const diffs: string[] = [];
      rows.forEach((runs, i) => {
        const r = i + 1;
        let c = 0;
        for (const [u, fg, bg, , count] of runs) {
          for (let k = 0; k < count; k++, c++) {
            const cell = screen.cells[r][c];
            if (cell.covered) continue; // the lower half of a double-height character
            const ch = cell.drcs ? "DRCS" : cell.mosaic > 0 ? `M${cell.mosaic}` : cell.ch;
            const want = libzvbiChar(u);
            if (ch !== want) diffs.push(`${r},${c}: ${ch} != ${want}`);
            if (screen.palette[cell.bg] !== bg) diffs.push(`${r},${c}: background`);
            if (ch !== " " && screen.palette[cell.fg] !== fg) diffs.push(`${r},${c}: foreground`);
          }
        }
      });
      expect(diffs).toEqual([]);
    });
  }

  it("renders the logo's DRCS characters", () => {
    const page = store.page(0x100)!.subpages[0];
    const screen = buildScreen(store, page, headerRow(page.header, "P100", new Date()));
    const drcs = screen.cells.flat().filter((cell) => cell.drcs);
    expect(drcs.length).toBeGreaterThan(20);
    expect(drcs.some((cell) => cell.drcs!.some((row) => row !== 0))).toBe(true);
  });

  it("renders pixels", () => {
    const page = store.page(0x200)!.subpages[0];
    const screen = buildScreen(store, page, headerRow(page.header, "P200", new Date()));
    const out = new Uint32Array(WIDTH * HEIGHT);
    render(screen, out, { flashOn: true, reveal: false, mix: false });
    // Row 1 is yellow double-height text on black: both colours occur there.
    const row1 = out.subarray(20 * WIDTH, 60 * WIDTH);
    expect(row1).toContain(0xff00ffff);
    expect(row1).toContain(0xff000000);
  });
});

describe("header row", () => {
  it("keeps the header text and runs its own clock", () => {
    const header = new Uint8Array(32).fill(0x20);
    const text = "FRIKANALEN      01.01 00:00:00";
    for (let i = 0; i < text.length; i++) header[i + 2] = text.charCodeAt(i);
    const now = new Date("2026-11-15T17:00:05Z");
    const row = String.fromCharCode(...headerRow(header, "P100", now));
    expect(row.startsWith("P100    ")).toBe(true);
    expect(row).toContain("FRIKANALEN");
    expect(row.endsWith(clockText(now))).toBe(true);
    expect(clockText(now)).toBe("15.11 18:00:05");
  });
});
