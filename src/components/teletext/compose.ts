// Turns a decoded page into a grid of cells to draw: the Level 1 rows (spacing
// attributes) first, then the Level 2.5 page format (X/28/0, or the magazine's M/29/0)
// and enhancements (X/26), including objects and DRCS from other pages. References are
// to ETS 300 706; where it leaves room, this does what libzvbi does.

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
  /** G3 smooth mosaic or line drawing character (0x20-0x7F), or -1. */
  g3: number;
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

/** The page's own X/28/0, else the magazine's M/29/0 (`magazine`). */
const pageFormat = (page: Page, magazine: number[] | null): Format => {
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
  const own = page.x28.get(0);
  const words = own ?? magazine;
  if (!words) return f;
  const b = new Bits(words);
  if (b.take(4) !== 0) return f; // page function: only a basic level one page's
  b.take(3); // page coding
  const g0set = b.take(7);
  const second = b.take(7);
  // Latin groups only; the national option is the low 3 bits. The magazine's default
  // leaves the page's own national option (C12-C14) alone.
  if (own && g0set >> 3 <= 2) f.national = g0set & 7;
  if (own && second >> 3 <= 2) f.secondNational = second & 7;
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
  g3: -1,
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

/** Object types (§13.2): an object may only invoke objects of a higher type. */
export const LOCAL = 0;
export const ACTIVE = 1;
export const ADAPTIVE = 2;
export const PASSIVE = 3;

/**
 * What the page's enhancements may need from other pages. Each lookup gives null when
 * the data isn't there (yet); the page then shows at Level 1, as a decoder does.
 */
export type Enhancements = {
  /** A DRCS character: `global` (GDRCS) or the page's own DRCS page, subpage `s1`. */
  drcs: (_global: boolean, _s1: number, _ptu: number) => Uint16Array | null;
  /**
   * The triplets of an object, from just after its definition: `source` 2 = POP page,
   * 3 = GPOP page; `address` is the invocation triplet's address and data, (a << 7) | d.
   */
  object: (_source: number, _type: number, _address: number) => Triplet[] | null;
  /** Objects to show on a page without X/26 (the MOT's default objects), in order. */
  defaults: () => { type: number; triplets: Triplet[] }[] | null;
  /** The magazine's M/29/0 (default page format), if any. */
  magazine: number[] | null;
};

class NotAvailable extends Error {}

// Level 1 (§12.2): spacing attributes, row by row.
const level1 = (
  page: Page,
  row0: Uint8Array,
  f: Format,
  rowColour: number[],
): { cells: Cell[][]; hasFlash: boolean } => {
  const cells: Cell[][] = [];
  let hasFlash = false;
  let skipNext = false;

  for (let r = 0; r < ROWS; r++) {
    const fgCol = (c: number) => f.fgTable * 8 + c;
    const bgCol = (c: number) => (c === 0 && f.blackBgSub ? rowColour[r] : f.bgTable * 8 + c);
    const row: Cell[] = [];
    cells.push(row);
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
    const at = (c: number) => (bytes && c < COLS ? bytes[c] & 0x7f : 0x20);

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
      const b = at(c);
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
            break;
          case 0x1d:
            bgL1 = fg;
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
        } else if (b === 0x08) flash = true;
        // Boxes take two codes in a row.
        else if (b === 0x0a && at(c + 1) === 0x0a) boxed = false;
        else if (b === 0x0b && at(c + 1) === 0x0b) boxed = true;
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
  return { cells, hasFlash };
};

/** What a triplet puts in a cell. */
type Content = { ch: string } | { mosaic: number } | { g3: number } | { drcs: Uint16Array };

const putContent = (cell: Cell, x: Content) => {
  cell.ch = "ch" in x ? x.ch : " ";
  cell.mosaic = "mosaic" in x ? x.mosaic : -1;
  cell.g3 = "g3" in x ? x.g3 : -1;
  cell.drcs = "drcs" in x ? x.drcs : null;
};

/** Attributes being laid down, and which of them are set ("modified"). */
type Attrs = {
  content: Content | null;
  fg: number;
  bg: number;
  boxed: boolean;
  dh: boolean;
  dw: boolean;
  flash: boolean;
  conceal: boolean;
  separated: boolean;
};
type Modified = {
  content: boolean;
  fg: boolean;
  bg: boolean;
  boxed: boolean;
  size: boolean;
  flash: boolean;
  conceal: boolean;
  separated: boolean;
};
const NONE: Modified = {
  content: false,
  fg: false,
  bg: false,
  boxed: false,
  size: false,
  flash: false,
  conceal: false,
  separated: false,
};

type Context = {
  page: Page;
  row0: Uint8Array;
  cells: Cell[][];
  f: Format;
  ext: Enhancements | null;
  boxedOnly: boolean;
  screenColour: number;
  hasFlash: boolean;
};

/**
 * Apply a run of enhancement triplets (§13): the page's own X/26 (type LOCAL) or an
 * object placed at (`invRow`, `invCol`). Attributes build up and are laid onto the cells
 * from the active position to the next position that's addressed ("flushed"). Throws
 * NotAvailable when a referenced page is missing.
 */
const enhance = (
  ctx: Context,
  type: number,
  triplets: Triplet[],
  invRow: number,
  invCol: number,
) => {
  const { cells, f } = ctx;
  let activeRow = 0;
  let activeCol = 0;
  let offsetRow = 0;
  let offsetCol = 0;
  let rowColour = f.row;
  let nextRowColour = f.row;
  let rowTransparent = false;
  let invert = false;
  const drcsS1 = [0, 0]; // global, normal
  const ac: Attrs = {
    content: null,
    fg: 0,
    bg: 0,
    boxed: false,
    dh: false,
    dw: false,
    flash: false,
    conceal: false,
    separated: false,
  };
  let mac: Modified = { ...NONE };
  if (type === PASSIVE) {
    // Passive objects bring all their attributes: white on black unless they say.
    ac.fg = 7;
    mac = { ...NONE, fg: true, bg: true, boxed: true, size: true, flash: true, conceal: true };
    mac.separated = true;
  }

  // Level 1 attributes in the row stop X/26 attributes of local enhancements and active
  // objects (§13.4).
  const rawAt = (row: number, col: number) => {
    if (row === 0 && col < 8) return 0x20;
    const bytes = row === 0 ? ctx.row0 : ctx.page.rows[row];
    return bytes ? bytes[col] & 0x7f : 0x20;
  };

  const flush = (column: number) => {
    const row = invRow + activeRow;
    if (row >= ROWS || row < 0) return;
    if (type === PASSIVE && !mac.content) {
      activeCol = column;
      return;
    }
    for (let i = invCol + activeCol; i < invCol + column;) {
      if (i > 39) break;
      const cell = cells[row][i];
      if (i >= 0) {
        let content = mac.content ? ac.content : null;
        if (mac.separated) {
          // Underline/separated applies to block mosaics, new or already there.
          const pattern =
            content && "mosaic" in content ? content.mosaic : !content ? cell.mosaic : -1;
          if (pattern >= 0) {
            content = { mosaic: pattern };
            cell.separated = ac.separated;
          }
        }
        const colour = (c: number) =>
          c !== TRANSPARENT ? c : rowTransparent ? TRANSPARENT : rowColour;
        if (mac.fg) cell.fg = colour(ac.fg);
        if (mac.bg) cell.bg = colour(ac.bg);
        if (invert) [cell.fg, cell.bg] = [cell.bg, cell.fg];
        if (mac.boxed) cell.boxed = ac.boxed;
        if (mac.flash) cell.flash = ac.flash;
        if (mac.conceal) cell.conceal = ac.conceal;
        if (content) {
          putContent(cell, content);
          mac.content = false;
          if (mac.size) {
            cell.doubleHeight = ac.dh && row < 23;
            cell.doubleWidth = ac.dw && i < COLS - 1;
          }
        }
        ctx.hasFlash ||= cell.flash;
      }
      if (type === PASSIVE) break;
      i++;
      if (type === LOCAL || type === ACTIVE) {
        const after = rawAt(row, i - 1);
        if (after <= 0x07 || (after >= 0x10 && after <= 0x17)) {
          mac.fg = false;
          mac.conceal = false;
        } else if (after === 0x08) mac.flash = false;
        else if ((after === 0x0a || after === 0x0b) && i < COLS && rawAt(row, i) === after) {
          mac.boxed = false;
        } else if (after >= 0x0d && after <= 0x0f) mac.size = false;
        if (i > 39) break;
        const atNext = rawAt(row, i);
        if (atNext === 0x09) mac.flash = false;
        else if (atNext === 0x0c) mac.size = false;
        else if (atNext === 0x18) mac.conceal = false;
        else if (atNext === 0x1c || atNext === 0x1d) mac.bg = false;
      }
    }
    activeCol = column;
  };

  const flushRow = () => {
    flush(type === PASSIVE || type === ADAPTIVE ? activeCol + 1 : COLS);
    if (type !== PASSIVE) mac = { ...NONE };
  };

  const store = (content: Content) => {
    ac.content = content;
    mac.content = true;
  };

  for (const t of triplets) {
    if (t.address >= COLS) {
      // Row address triplets.
      let row = rowAddress(t.address);
      let column = 0;
      const s = t.data >> 5;
      let setActive = false;
      switch (t.mode) {
        case 0x00: // full screen colour
          if (s === 0 && type <= ACTIVE) ctx.screenColour = t.data & 31;
          break;
        case 0x07: // address display row 0
          if (t.address !== 0x3f) break;
          row = 0;
        // falls through
        case 0x01: // full row colour
          rowColour = nextRowColour;
          if (s === 0) {
            rowColour = t.data & 31;
            nextRowColour = f.row;
          } else if (s === 3) rowColour = nextRowColour = t.data & 31;
          setActive = true;
          break;
        case 0x04: // set active position
          if (t.data >= COLS) break;
          column = t.data;
          if (row > activeRow) rowColour = nextRowColour;
          setActive = true;
          break;
        case 0x10: // origin modifier
          if (t.data < 72) {
            offsetCol = t.data;
            offsetRow = t.address - 40;
          }
          break;
        case 0x11:
        case 0x12:
        case 0x13: {
          // Object invocation.
          const source = (t.address >> 3) & 3;
          const newType = t.mode & 3;
          if (newType <= type || source === 0) break;
          let objTriplets: Triplet[] | null;
          if (source === 1) {
            // Local object: in this page's own X/26.
            const designation = (t.data >> 4) | ((t.address & 1) << 4);
            const index = t.data & 15;
            if (type !== LOCAL || index > 12) break;
            objTriplets = ctx.page.x26.slice(designation * 13 + index);
            // The invocation points at the object's definition.
            if (objTriplets.shift()?.mode !== newType + 0x14) break;
          } else {
            objTriplets = ctx.ext?.object(source, newType, (t.address << 7) | t.data) ?? null;
          }
          if (!objTriplets) throw new NotAvailable();
          enhance(
            ctx,
            newType,
            objTriplets,
            invRow + activeRow + offsetRow,
            invCol + activeCol + offsetCol,
          );
          offsetRow = offsetCol = 0;
          break;
        }
        case 0x15:
        case 0x16:
        case 0x17: // the next object's definition ends this one
        case 0x1f: // termination marker
          flushRow();
          return;
        case 0x18: // DRCS mode
          drcsS1[t.data >> 6] = t.data & 15;
          break;
      }
      if (setActive) {
        if (row > activeRow) flushRow();
        else flush(activeCol + 1);
        activeRow = row;
        activeCol = column;
      }
      continue;
    }

    // Column address triplets.
    const column = t.address;
    const s = t.data >> 5;
    const moveTo = () => {
      if (column > activeCol) flush(column);
    };
    switch (t.mode) {
      case 0x00: // foreground colour
        if (s !== 0) break;
        moveTo();
        ac.fg = t.data & 31;
        mac.fg = true;
        break;
      case 0x01: // G1 block mosaic character
        moveTo();
        if (t.data & 0x20) store({ mosaic: (t.data & 0x1f) | ((t.data & 0x40) >> 1) });
        else if (t.data >= 0x40) store({ ch: g0(t.data, -1) });
        break;
      case 0x02: // G3 smooth mosaic or line drawing character
      case 0x0b:
        if (t.data < 0x20) break;
        moveTo();
        store({ g3: t.data });
        break;
      case 0x03: // background colour
        if (s !== 0) break;
        moveTo();
        ac.bg = t.data & 31;
        mac.bg = true;
        break;
      case 0x07: // additional flash
        moveTo();
        ac.flash = (t.data & 3) !== 0;
        mac.flash = true;
        break;
      case 0x09: // G0 character, no national option
        if (t.data < 0x20) break;
        moveTo();
        store({ ch: g0(t.data, -1) });
        break;
      case 0x0c: // display attributes
        moveTo();
        ac.dh = !!(t.data & 0x01);
        ac.dw = !!(t.data & 0x40);
        mac.size = true;
        if (ctx.boxedOnly) {
          ac.boxed = !!(t.data & 0x02);
          mac.boxed = true;
        } else rowTransparent = !!(t.data & 0x02);
        ac.conceal = !!(t.data & 0x04);
        mac.conceal = true;
        invert = !!(t.data & 0x10);
        ac.separated = !!(t.data & 0x20);
        mac.separated = true;
        break;
      case 0x0d: {
        // DRCS character.
        const normal = t.data >> 6;
        const ptu = t.data & 0x3f;
        if (ptu >= 48) break;
        moveTo();
        const glyph = ctx.ext?.drcs(!normal, drcsS1[normal], ptu) ?? null;
        if (!glyph) throw new NotAvailable();
        store({ drcs: glyph });
        break;
      }
      case 0x0f: // G2 character
        if (t.data < 0x20) break;
        moveTo();
        store({ ch: g2(t.data) });
        break;
      default:
        if (t.mode >= 0x10 && t.data >= 0x20) {
          moveTo();
          store({ ch: withDiacritic(t.data, t.mode - 0x10) });
        }
    }
  }
  flushRow();
};

/**
 * Build the screen for `page`. `row0` is the 40-byte header row as displayed (the
 * decoder's own status in columns 0-7, then the header text).
 */
export const compose = (
  page: Page,
  row0: Uint8Array,
  ext: Enhancements | null,
  level: 1 | 2.5 = 2.5,
): Screen => {
  const f =
    level >= 2.5
      ? pageFormat(page, ext?.magazine ?? null)
      : pageFormat({ ...page, x28: new Map() }, null);
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
  const plain = level1(page, row0, f, rowColour);
  let { cells, hasFlash } = plain;

  if (level >= 1.5) {
    const ctx: Context = {
      page,
      row0,
      cells: cells.map((row) => row.map((cell) => ({ ...cell }))),
      f,
      ext,
      boxedOnly,
      screenColour,
      hasFlash,
    };
    try {
      let ran = false;
      if (x26.length) {
        enhance(ctx, LOCAL, x26, 0, 0);
        ran = true;
      } else if (level >= 2.5) {
        const defaults = ext?.defaults() ?? null;
        for (const d of defaults ?? []) enhance(ctx, d.type, d.triplets, 0, 0);
        ran = !!defaults?.length;
      }
      if (ran) {
        ({ cells, hasFlash, screenColour } = ctx);
        // A cell with transparent foreground and background shows nothing.
        for (const row of cells) {
          for (const cell of row) {
            if (cell.fg === TRANSPARENT && cell.bg === TRANSPARENT) putContent(cell, { ch: " " });
          }
        }
      }
    } catch (e) {
      // Something the page refers to isn't there: show it at Level 1.
      if (!(e instanceof NotAvailable)) throw e;
    }
  }

  // Double-size characters cover their neighbours.
  for (const row of cells) for (const cell of row) cell.covered = false;
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
