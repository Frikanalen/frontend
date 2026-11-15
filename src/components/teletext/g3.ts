// The G3 set (smooth mosaics and line drawing, ETS 300 706 §15.6.3), drawn as shapes
// rather than glyphs: each character becomes a 12x20 mask, built on first use.

import { G3_WEDGES } from "./g3wedges";

const W = 12;
const H = 20;

type Shape = (_x: number, _y: number) => boolean; // x, y in 0..1, at the pixel centre

const polygon =
  (pts: number[]): Shape =>
  (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
      const [xi, yi, xj, yj] = [pts[i] / 6, pts[i + 1] / 6, pts[j] / 6, pts[j + 1] / 6];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

const rect =
  (x0: number, y0: number, x1: number, y1: number): Shape =>
  (x, y) =>
    x >= x0 && x < x1 && y >= y0 && y < y1;

const any =
  (...shapes: Shape[]): Shape =>
  (x, y) =>
    shapes.some((s) => s(x, y));

// Strokes: thin lines are a sixth of the cell wide; the thick bars of 0x40-0x43 and 0x4C
// are 0.4 of its height.
const T = 1 / 12;
const vLine = (y0 = 0, y1 = 1) => rect(0.5 - T, y0, 0.5 + T, y1);
const hThin = (x0 = 0, x1 = 1) => rect(x0, 0.4, x1, 0.6);
const hThick = (x0 = 0, x1 = 1) => rect(x0, 0.3, x1, 0.7);

// An ellipse centred in the cell; `ring` gives the stroke width (0 = filled).
const ellipse =
  (rx: number, ry: number, ring = 0, part: Shape = () => true): Shape =>
  (x, y) => {
    const d = ((x - 0.5) / rx) ** 2 + ((y - 0.5) / ry) ** 2;
    if (d > 1 || !part(x, y)) return false;
    if (!ring) return true;
    const di = ((x - 0.5) / (rx - ring)) ** 2 + ((y - 0.5) / (ry - ring * 1.2)) ** 2;
    return di >= 1;
  };
const arc = (part: Shape) => ellipse(0.5, 0.5, 0.15, part);

const arrow = (dir: "r" | "l" | "u" | "d"): Shape => {
  const shape = any(rect(0, 0.4, 0.85, 0.6), polygon([2, 1.2, 5.1, 3, 2, 4.8]));
  const map: Record<string, (_x: number, _y: number) => [number, number]> = {
    r: (x, y) => [x, y],
    l: (x, y) => [1 - x, y],
    u: (x, y) => [1 - y, x],
    d: (x, y) => [y, x],
  };
  return (x, y) => shape(...map[dir](x, y));
};

const LINE_DRAWING: Record<number, Shape> = {
  0x40: any(hThick(T), vLine(0, 0.3)),
  0x41: any(hThick(), vLine(0.7, 1)),
  0x42: any(vLine(), hThick(0.5 - T)),
  0x43: any(vLine(), hThick(0, 0.5 + T)),
  0x44: arc((x) => x < 0.5),
  0x45: arc((x) => x >= 0.5),
  0x46: arc((_x, y) => y >= 0.5),
  0x47: arc((_x, y) => y < 0.5),
  0x48: arc((x, y) => x < 0.5 && y < 0.5),
  0x49: arc((x, y) => x >= 0.5 && y < 0.5),
  0x4a: arc((x, y) => x < 0.5 && y >= 0.5),
  0x4b: arc((x, y) => x >= 0.5 && y >= 0.5),
  0x4c: any(hThick(), vLine()),
  0x4d: ellipse(0.25, 0.2),
  0x4e: ellipse(0.5, 0.4),
  0x4f: ellipse(0.5, 0.4, 0.15),
  0x50: vLine(),
  0x51: hThin(),
  0x52: any(hThin(0.5 - T), vLine(0.4)),
  0x53: any(hThin(0, 0.5 + T), vLine(0.4)),
  0x54: any(hThin(0.5 - T), vLine(0, 0.6)),
  0x55: any(hThin(0, 0.5 + T), vLine(0, 0.6)),
  0x56: any(vLine(), hThin(0.5 - T)),
  0x57: any(vLine(), hThin(0, 0.5 + T)),
  0x58: any(hThin(), vLine(0.4)),
  0x59: any(hThin(), vLine(0, 0.6)),
  0x5a: any(hThin(), vLine()),
  0x5b: arrow("r"),
  0x5c: arrow("l"),
  0x5d: arrow("u"),
  0x5e: arrow("d"),
};

const shapeFor = (code: number): Shape | null => {
  const wedge = G3_WEDGES[code];
  if (wedge) return any(...wedge.map(polygon));
  switch (code) {
    case 0x2e:
      return rect(1 / 6, 0, 2 / 6, 1);
    case 0x3e:
      return rect(4 / 6, 0, 5 / 6, 1);
    case 0x3f:
      return () => true;
    case 0x2f: // 50% stipple, drawn per pixel below
      return null;
  }
  return LINE_DRAWING[code] ?? null;
};

const masks = new Map<number, Uint8Array>();

/** 12x20 mask (1 = foreground) for G3 character `code`. */
export const g3Mask = (code: number): Uint8Array => {
  let m = masks.get(code);
  if (m) return m;
  m = new Uint8Array(W * H);
  const shape = shapeFor(code);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const on =
        code === 0x2f ? ((x >> 1) + (y >> 1)) % 2 === 0 : !!shape?.((x + 0.5) / W, (y + 0.5) / H);
      m[y * W + x] = on ? 1 : 0;
    }
  }
  masks.set(code, m);
  return m;
};
