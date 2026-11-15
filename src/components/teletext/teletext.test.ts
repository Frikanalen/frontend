import { describe, expect, it } from "vitest";
import snapshot from "./__fixtures__/snapshot.json";
import libzvbi from "./__fixtures__/libzvbi-cells.json";
import assetsSnapshot from "./__fixtures__/snapshot-assets.json";
import assetsLibzvbi from "./__fixtures__/libzvbi-assets-cells.json";
import { g2 } from "./charset";
import { decodeBase64, decodePage, unham84 } from "./decode";
import { render, WIDTH, HEIGHT } from "./render";
import { buildScreen, clockText, headerRow } from "./screen";
import { TeletextStore } from "./store";

// The fixtures are real ttxd output: snapshot.json is its public feed with page 100 from
// the page generator (Level 2.5 palette, DRCS logo on page 10F, fastext) and test pages
// 200 (Level 1 attributes) and 201 (X/26 enhancements). snapshot-assets.json has ttxd's
// shared assets (PUT /v1/assets: MOT page 2FE with the M/29/0 palette, global objects on
// 8E8, global DRCS on 8E9) and test pages 202 (every G3 character) and 203 (magazine
// palette, global DRCS, active, adaptive and passive objects). libzvbi-*cells.json is
// what libzvbi, an independent decoder, makes of the same pages, dumped with
// scripts/teletext-t42cells.c from ttxd's T42 debug stream. Each row is a list of runs
// [unicode, foreground, background, size, count].

type Snapshot = { pages: { page: string; cycle_secs: number; subpages: string[] }[] };
const storeOf = (snap: Snapshot) => {
  const s = new TeletextStore("unused");
  for (const p of snap.pages) {
    s.pages.set(parseInt(p.page, 16), {
      cycleSecs: p.cycle_secs,
      expires: null,
      subpages: p.subpages.map((x) => decodePage(decodeBase64(x))!),
    });
  }
  return s;
};
// Where libzvbi 0.2.42 (the version the fixtures come from) is wrong: it applies a
// passive object's "contiguous" attribute to G3 characters too, turning 0x4D into 0x6D.
// libzvbi 0.2.46 checks for block mosaics first.
const LIBZVBI_BUGS: Record<string, string> = { "203:7,30": "G3:4d" };

const store = storeOf(snapshot);
const assetsStore = storeOf(assetsSnapshot);

// libzvbi puts block mosaics at U+EE00 + the character code (U+EE20-EE3F and EE60-EE7F
// contiguous, the same less 0x20 separated), G3 characters at U+EF00 + the code and DRCS
// characters at U+F000 and up.
const libzvbiChar = (u: number) => {
  if (u >= 0xf000) return "DRCS";
  if (u >= 0xef00) return `G3:${(u & 0x7f).toString(16)}`;
  if (u >= 0xee00) {
    const pattern = (u & 0x1f) | ((u & 0x40) >> 1);
    return pattern ? `M${pattern}${u & 0x20 ? "" : "s"}` : " ";
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

  const cases: [TeletextStore, Record<string, number[][][]>][] = [
    [store, libzvbi],
    [assetsStore, assetsLibzvbi],
  ];
  for (const [st, fixture] of cases) {
    for (const [name, rows] of Object.entries(fixture)) {
      it(`draws page ${name} as libzvbi does`, () => {
        const page = st.page(parseInt(name, 16))!.subpages[0];
        const screen = buildScreen(st, page, headerRow(page.header, "P" + name, new Date()));
        const diffs: string[] = [];
        rows.forEach((runs, i) => {
          const r = i + 1;
          let c = 0;
          for (const [u, fg, bg, size, count] of runs) {
            for (let k = 0; k < count; k++, c++) {
              const cell = screen.cells[r][c];
              if (cell.covered) continue; // the lower half of a double-height character
              const ch = cell.drcs
                ? "DRCS"
                : cell.g3 >= 0
                  ? `G3:${cell.g3.toString(16)}`
                  : cell.mosaic > 0
                    ? `M${cell.mosaic}${cell.separated ? "s" : ""}`
                    : cell.ch;
              const want = LIBZVBI_BUGS[`${name}:${r},${c}`] ?? libzvbiChar(u);
              if (ch !== want) diffs.push(`${r},${c}: ${ch} != ${want}`);
              if (screen.palette[cell.bg] !== bg) diffs.push(`${r},${c}: background`);
              if (ch !== " " && screen.palette[cell.fg] !== fg) diffs.push(`${r},${c}: foreground`);
              // libzvbi sizes: 1 double width, 2 double height, 3 double size.
              const ours = (cell.doubleWidth ? 1 : 0) | (cell.doubleHeight ? 2 : 0);
              if (size <= 3 && ours !== size) diffs.push(`${r},${c}: size ${ours} != ${size}`);
            }
          }
        });
        expect(diffs).toEqual([]);
      });
    }
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
