// Draws a composed screen into RGBA pixels: 12x20 pixels per cell (the SAA5050's 6x10
// dots at twice their resolution, which is where its character rounding lives), so a
// page is 480x500.

import { COLS, ROWS, TRANSPARENT, type Cell, type Screen } from "./compose";
import { GLYPH_CHARS, GLYPH_DATA } from "./font";
import { g3Mask } from "./g3";

export const CELL_W = 12;
export const CELL_H = 20;
export const WIDTH = COLS * CELL_W;
export const HEIGHT = ROWS * CELL_H;

const GLYPH_BYTES = (CELL_W * CELL_H) / 8;
let glyphBits: Uint8Array | null = null;
const glyphIndex = new Map<string, number>();

const glyph = (ch: string): number => {
  if (!glyphBits) {
    const bin = atob(GLYPH_DATA);
    glyphBits = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) glyphBits[i] = bin.charCodeAt(i);
    Array.from(GLYPH_CHARS).forEach((c, i) => glyphIndex.set(c, i));
  }
  let i = glyphIndex.get(ch);
  // A letter the font lacks shows without its accent.
  if (i === undefined) i = glyphIndex.get(ch.normalize("NFD")[0]);
  return i ?? -1;
};

const pixelOn = (g: number, x: number, y: number) => {
  const bit = y * CELL_W + x;
  return (glyphBits![g * GLYPH_BYTES + (bit >> 3)] >> (bit & 7)) & 1;
};

// Block mosaic cells: columns 0-5 | 6-11, rows 0-5 | 6-13 | 14-19. Separated mosaics
// leave a gap on the left and at the bottom of each block.
const mosaicOn = (pattern: number, separated: boolean, x: number, y: number) => {
  const bx = x < 6 ? 0 : 1;
  const by = y < 6 ? 0 : y < 14 ? 1 : 2;
  if (!((pattern >> (by * 2 + bx)) & 1)) return false;
  if (!separated) return true;
  const lx = x - bx * 6;
  const yEnd = by === 0 ? 6 : by === 1 ? 14 : 20;
  return lx >= 2 && y < yEnd - 2;
};

export type RenderOptions = {
  flashOn: boolean;
  reveal: boolean;
  /** Mix: backgrounds show the picture underneath. */
  mix: boolean;
};

const rgba = (rgb: number) =>
  // ImageData is RGBA in memory; on little-endian that is 0xAABBGGRR.
  (0xff000000 | ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff)) >>> 0;

/** Draw `screen` into `out` (WIDTH x HEIGHT pixels, RGBA as little-endian uint32). */
export const render = (screen: Screen, out: Uint32Array, opt: RenderOptions) => {
  const colours = Array.from(screen.palette, rgba);
  colours[TRANSPARENT] = 0;
  const colour = (i: number) => colours[i] ?? 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = screen.cells[r][c];
      if (cell.covered) continue;
      drawCell(cell, r, c, out, colour, screen.boxedOnly, opt);
    }
  }
};

const drawCell = (
  cell: Cell,
  r: number,
  c: number,
  out: Uint32Array,
  colour: (_i: number) => number,
  boxedOnly: boolean,
  opt: RenderOptions,
) => {
  const sx = cell.doubleWidth ? 2 : 1;
  const sy = cell.doubleHeight ? 2 : 1;
  const hidden = (boxedOnly && !cell.boxed) || false;
  const bg = hidden || (opt.mix && !cell.boxed) ? 0 : colour(cell.bg);
  const fg = hidden ? 0 : colour(cell.fg);
  const showFg = !hidden && !(cell.flash && !opt.flashOn) && !(cell.conceal && !opt.reveal);
  const g3 = showFg && cell.g3 >= 0 ? g3Mask(cell.g3) : null;
  const g = showFg && cell.mosaic < 0 && !g3 && !cell.drcs && cell.ch !== " " ? glyph(cell.ch) : -1;

  const x0 = c * CELL_W;
  const y0 = r * CELL_H;
  for (let y = 0; y < CELL_H * sy; y++) {
    const py = y0 + y;
    if (py >= HEIGHT) break;
    const gy = Math.floor(y / sy);
    let line = py * WIDTH + x0;
    for (let x = 0; x < CELL_W * sx; x++, line++) {
      if (x0 + x >= WIDTH) break;
      const gx = Math.floor(x / sx);
      let on = false;
      if (showFg) {
        if (cell.mosaic >= 0) on = mosaicOn(cell.mosaic, cell.separated, gx, gy);
        else if (g3) on = g3[gy * CELL_W + gx] === 1;
        else if (cell.drcs) on = !!((cell.drcs[gy >> 1] >> (11 - gx)) & 1);
        else if (g >= 0) on = !!pixelOn(g, gx, gy);
      }
      out[line] = on ? fg : bg;
    }
  }
};
