// Turns a decoded page into a grid of cells to draw: the Level 1 row (spacing
// attributes) first, then the Level 2.5 page format (X/28/0) and enhancements (X/26).
// References are to ETS 300 706.

import { g0, g2, withDiacritic } from "./charset";
import type { Page, Triplet } from "./decode";

export const ROWS = 25;
export const COLS = 40;
/** Palette index that shows the picture underneath. */
export const TRANSPARENT = 8;

export type Cell = {
  /** Character to draw (empty or " " for none). */
  ch: string;
  /** Block mosaic: the six cells as bits 0-5, or -1. */
  mosaic: number;
  separated: boolean;
  /** DRCS character: 10 rows of 12 pixels (bit 11 = left), or null. */
  drcs: Uint16Array | null;
  fg: number; // palette index 0-31
  bg: number;
  flash: boolean;
  conceal: boolean;
  boxed: boolean;
  doubleHeight: boolean;
  doubleWidth: boolean;
  /** Drawn by the double-size cell above or to the left. */
  covered: boolean;
};

export type Screen = {
  cells: Cell[][];
  palette: Uint32Array; // 32 colours as 0xRRGGBB, index 8 transparent
  screenColour: number;
  /** Only boxed characters show (subtitle and newsflash pages). */
  boxedOnly: boolean;
  hasFlash: boolean;
};

// Colour tables 0-3 (§12.4), as 12-bit RGB.
const DEFAULT_CLUT = [
  0x000, 0xf00, 0x0f0, 0xff0, 0x00f, 0xf0f, 0x0ff, 0xfff, 0x000, 0x700, 0x070, 0x770, 0x007, 0x707,
  0x077, 0x777, 0xf05, 0xf70, 0x0f7, 0xffb, 0x0ca, 0x500, 0x652, 0xc77, 0x333, 0xf77, 0x7f7, 0xff7,
  0x77f, 0xf7f, 0x7ff, 0xddd,
];

const rgb12 = (v: number) => {
  const r = (v >> 8) & 15;
  const g = (v >> 4) & 15;
  const b = v & 15;
  return ((r * 17) << 16) | ((g * 17) << 8) | (b * 17);
};

// Colour table remapping (§9.4.2 Table 32): (foreground table, background table).
const REMAP: [number, number][] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 1],
  [1, 2],
  [2, 1],
  [2, 2],
  [3, 3],
];

type Format = {
  palette: Uint32Array;
  screen: number;
  row: number;
  blackBgSub: boolean;
  fgTable: number;
  bgTable: number;
  national: number;
  secondNational: number;
};

/** Reads fields from 18-bit triplet words, least significant bit first. */
class Bits {
  private i = 0;
  private words: number[];
  constructor(words: number[]) {
    this.words = words;
  }
  take(n: number) {
    let v = 0;
    for (let k = 0; k < n; k++, this.i++) {
      const w = this.words[Math.floor(this.i / 18)] ?? 0;
      v |= ((w >> (this.i % 18)) & 1) << k;
    }
    return v;
  }
}

const pageFormat = (page: Page): Format => {
  const palette = Uint32Array.from(DEFAULT_CLUT, rgb12);
  const f: Format = {
    palette,
    screen: 0,
    row: 0,
    blackBgSub: false,
    fgTable: 0,
    bgTable: 0,
    national: page.national,
    secondNational: page.national,
  };
  const x28 = page.x28.get(0);
  if (!x28) return f;
  const b = new Bits(x28);
  b.take(4); // page function
  b.take(3); // page coding
  const g0set = b.take(7);
  const second = b.take(7);
  // Latin groups only; the national option is the low 3 bits.
  if (g0set >> 3 <= 2) f.national = g0set & 7;
  if (second >> 3 <= 2) f.secondNational = second & 7;
  b.take(7); // side panels
  // Format 1 redefines colour tables 2 and 3. libzvbi's bit order: red in the low nibble.
  for (let i = 0; i < 16; i++) {
    const v = b.take(12);
    palette[16 + i] =
      (((v & 15) * 17) << 16) | ((((v >> 4) & 15) * 17) << 8) | (((v >> 8) & 15) * 17);
  }
  f.screen = b.take(5);
  f.row = b.take(5);
  f.blackBgSub = !!b.take(1);
  [f.fgTable, f.bgTable] = REMAP[b.take(3)];
  return f;
};

const blank = (bg: number): Cell => ({
  ch: " ",
  mosaic: -1,
  separated: false,
  drcs: null,
  fg: 7,
  bg,
  flash: false,
  conceal: false,
  boxed: false,
  doubleHeight: false,
  doubleWidth: false,
  covered: false,
});

const rowAddress = (a: number) => (a === 40 ? 24 : a - 40);

export type DrcsLookup = (_subpage: number, _ptu: number) => Uint16Array | null;

/** Decode a 12x10 DRCS character from a DRCS page row pair (§14). */
export const drcsFromRows = (rows: (Uint8Array | null)[], ptu: number) => {
  const row = rows[(ptu >> 1) + 1];
  if (!row) return null;
  const off = (ptu & 1) * 20;
  const out = new Uint16Array(10);
  for (let y = 0; y < 10; y++) {
    out[y] = ((row[off + 2 * y] & 0x3f) << 6) | (row[off + 2 * y + 1] & 0x3f);
  }
  return out;
};

/**
 * Build the screen for `page`. `row0` is the 40-byte header row as displayed (the
 * decoder's own status in columns 0-7, then the header text).
 */
export const compose = (
  page: Page,
  row0: Uint8Array,
  drcs: DrcsLookup | null,
  level: 1 | 2.5 = 2.5,
): Screen => {
  const f = level >= 2.5 ? pageFormat(page) : pageFormat({ ...page, x28: new Map() });
  const x26 = level >= 1.5 ? page.x26 : [];

  // Full screen and full row colours come first: the Level 1 pass needs them for black
  // background substitution.
  let screenColour = f.screen;
  const rowColour = new Array(ROWS).fill(f.row);
  {
    let row = 0;
    for (const t of x26) {
      if (t.address < 40) continue;
      if (t.mode === 0x1f) break;
      if (t.mode === 0x00 && t.data >> 5 === 0) screenColour = t.data & 31;
      if (t.mode === 0x01 || t.mode === 0x04) row = rowAddress(t.address);
      if (t.mode === 0x01) {
        const colour = t.data & 31;
        const to = t.data >> 5 === 3 ? ROWS : row + 1;
        for (let r = row; r < to; r++) rowColour[r] = colour;
      }
    }
  }

  const boxedOnly = page.subtitle || page.newsflash;
  const cells: Cell[][] = [];
  // Where a Level 1 attribute changed the colours; X/26 colours stop there (§13.4).
  const fgMark: boolean[][] = [];
  const bgMark: boolean[][] = [];
  let hasFlash = false;
  let skipNext = false;

  for (let r = 0; r < ROWS; r++) {
    const fgCol = (c: number) => f.fgTable * 8 + c;
    const bgCol = (c: number) => (c === 0 && f.blackBgSub ? rowColour[r] : f.bgTable * 8 + c);
    const row: Cell[] = [];
    const fm: boolean[] = new Array(COLS).fill(false);
    const bm: boolean[] = new Array(COLS).fill(false);
    cells.push(row);
    fgMark.push(fm);
    bgMark.push(bm);
    const bytes = r === 0 ? row0 : skipNext ? null : page.rows[r];
    if (skipNext) {
      // The row below a double-height row is not shown (§12.2): the upper halves
      // cover it, and cells under normal-size characters keep their background.
      skipNext = false;
      for (let c = 0; c < COLS; c++) {
        const above = cells[r - 1][c];
        row.push({ ...blank(above.bg), boxed: above.boxed, covered: above.doubleHeight });
      }
      continue;
    }

    let fg = 7;
    let bgL1 = 0;
    let mosaics = false;
    let separated = false;
    let hold = false;
    let held = 0x20;
    let heldSep = false;
    let flash = false;
    let conceal = false;
    let boxed = false;
    let dh = false;
    let dw = false;
    let second = false;
    let anyDouble = false;

    for (let c = 0; c < COLS; c++) {
      const b = bytes ? bytes[c] & 0x7f : 0x20;
      if (b < 0x20) {
        // Set-at attributes.
        switch (b) {
          case 0x09:
            flash = false;
            break;
          case 0x0c:
            if (dh || dw) held = 0x20;
            dh = dw = false;
            break;
          case 0x18:
            conceal = true;
            break;
          case 0x19:
            separated = false;
            break;
          case 0x1a:
            separated = true;
            break;
          case 0x1c:
            bgL1 = 0;
            bm[c] = true;
            break;
          case 0x1d:
            bgL1 = fg;
            bm[c] = true;
            break;
          case 0x1e:
            hold = true;
            break;
        }
      }
      const cell = blank(bgCol(bgL1));
      cell.fg = fgCol(fg);
      cell.flash = flash;
      cell.conceal = conceal;
      cell.boxed = boxed;
      cell.doubleHeight = dh && r > 0 && r < 23;
      cell.doubleWidth = dw && c < COLS - 1;
      if (b < 0x20) {
        if (hold && mosaics) {
          cell.mosaic = held;
          cell.separated = heldSep;
        }
      } else if (mosaics && b & 0x20) {
        cell.mosaic = b;
        cell.separated = separated;
        held = b;
        heldSep = separated;
      } else {
        cell.ch = g0(b, second ? f.secondNational : f.national);
      }
      if (cell.mosaic >= 0) cell.mosaic = (cell.mosaic & 0x1f) | ((cell.mosaic & 0x40) >> 1);
      row.push(cell);
      hasFlash ||= flash;
      anyDouble ||= cell.doubleHeight;

      if (b < 0x20) {
        // Set-after attributes.
        if (b <= 0x07 || (b >= 0x10 && b <= 0x17)) {
          const toMosaics = b >= 0x10;
          if (toMosaics !== mosaics) held = 0x20;
          mosaics = toMosaics;
          fg = b & 7;
          conceal = false;
          if (c + 1 < COLS) fm[c + 1] = true;
        } else if (b === 0x08) flash = true;
        else if (b === 0x0a) boxed = false;
        else if (b === 0x0b) boxed = true;
        else if (b >= 0x0d && b <= 0x0f) {
          const ndh = b !== 0x0e;
          const ndw = b !== 0x0d;
          if (ndh !== dh || ndw !== dw) held = 0x20;
          dh = ndh;
          dw = ndw;
        } else if (b === 0x1b) second = !second;
        else if (b === 0x1f) hold = false;
      }
    }
    if (anyDouble) skipNext = true;
  }

  // Level 1.5 and 2.5 enhancements (§13).
  let row = 0;
  let col = 0;
  let drcsSub = 0;
  const forward = (r: number, c: number, set: (_cell: Cell) => void, stop: boolean[][]) => {
    for (let k = c; k < COLS; k++) {
      if (k > c && stop[r][k]) break;
      set(cells[r][k]);
    }
  };
  const put = (t: Triplet, apply: (_cell: Cell) => void) => {
    col = t.address;
    const cell = cells[row]?.[col];
    if (!cell) return;
    apply(cell);
  };
  const char = (ch: string) => (cell: Cell) => {
    cell.ch = ch;
    cell.mosaic = -1;
    cell.drcs = null;
  };
  for (const t of x26) {
    if (t.address >= 40) {
      switch (t.mode) {
        case 0x01:
          row = rowAddress(t.address);
          col = 0;
          break;
        case 0x04:
          row = rowAddress(t.address);
          col = t.data < COLS ? t.data : 0;
          break;
        case 0x07:
          row = 0;
          col = 0;
          break;
        case 0x18:
          drcsSub = t.data & 15;
          break;
      }
      if (t.mode === 0x1f) break;
      continue;
    }
    switch (t.mode) {
      case 0x00: // foreground colour
        col = t.address;
        forward(row, col, (cell) => (cell.fg = t.data & 31), fgMark);
        break;
      case 0x03: // background colour
        col = t.address;
        forward(row, col, (cell) => (cell.bg = t.data & 31), bgMark);
        break;
      case 0x01: // G1 block mosaic
        if (t.data & 0x20)
          put(t, (cell) => {
            char(" ")(cell);
            cell.mosaic = (t.data & 0x1f) | ((t.data & 0x40) >> 1);
          });
        break;
      case 0x07: // additional flash
        put(t, (cell) => {
          cell.flash = (t.data & 3) !== 0;
          hasFlash ||= cell.flash;
        });
        break;
      case 0x09: // G0 character, no national option
        if (t.data >= 0x20) put(t, char(g0(t.data, -1)));
        break;
      case 0x0c: // display attributes
        col = t.address;
        forward(
          row,
          col,
          (cell) => {
            cell.doubleHeight = !!(t.data & 0x01) && row > 0 && row < 23;
            cell.boxed = !!(t.data & 0x02);
            cell.conceal = !!(t.data & 0x04);
            cell.doubleWidth = !!(t.data & 0x40);
            if (t.data & 0x08) [cell.fg, cell.bg] = [cell.bg, cell.fg];
          },
          fgMark,
        );
        break;
      case 0x0d: // DRCS character
        put(t, (cell) => {
          const glyph = drcs?.(drcsSub, t.data & 0x3f) ?? null;
          char(" ")(cell);
          cell.drcs = glyph;
        });
        break;
      case 0x0f: // G2 character
        if (t.data >= 0x20) put(t, char(g2(t.data)));
        break;
      default:
        if (t.mode >= 0x10 && t.data >= 0x20) put(t, char(withDiacritic(t.data, t.mode - 0x10)));
    }
  }

  // Double-size characters cover their neighbours.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r][c];
      if (cell.covered) continue;
      if (cell.doubleWidth && c + 1 < COLS) cells[r][c + 1].covered = true;
      if (cell.doubleHeight && r + 1 < ROWS) {
        cells[r + 1][c].covered = true;
        if (cell.doubleWidth && c + 1 < COLS) cells[r + 1][c + 1].covered = true;
      }
    }
  }

  return { cells, palette: f.palette, screenColour, boxedOnly, hasFlash };
};
