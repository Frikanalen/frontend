// Data pages a Level 2.5 page draws on: the Magazine Organisation Table (page mFE,
// §10.6), which links pages to their POP/DRCS pages and the magazine's global ones, and
// the object pages themselves (POP and GPOP, §10.5). Layouts as libzvbi reads them.

import { packetKey, unham2418, unham84, type Page, type Triplet } from "./decode";

const NO_PAGE = (no: number) => (no & 0xff) === 0xff;

export type PopLink = {
  page: number;
  /** Default objects for pages without X/26 (§10.6.4): type 0 = none. */
  defaults: { type: number; address: number }[];
};

export type Mot = {
  /** Page (0x00-0xFF in the magazine) to POP link: 0 = none, 1-7 = `pop[n]`. */
  popLut: Uint8Array;
  /** Page to DRCS link, likewise into `drcs`. */
  drcsLut: Uint8Array;
  /** Level 2.5 POP links; link 0 is the magazine's GPOP page. */
  pop: (PopLink | null)[];
  /** Level 2.5 DRCS links; link 0 is the magazine's GDRCS page. */
  drcs: (number | null)[];
};

const nibbles = (data: Uint8Array, from: number, n: number) => {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(unham84(data[from + i]));
  return out;
};

const linkPage = (n: number[]) => ((n[0] & 7 || 8) << 8) | (n[1] << 4) | n[2];

export const parseMot = (mot: Page): Mot => {
  const m: Mot = {
    popLut: new Uint8Array(256),
    drcsLut: new Uint8Array(256),
    pop: new Array(8).fill(null),
    drcs: new Array(8).fill(null),
  };
  const lut = (index: number, data: Uint8Array, i: number) => {
    const [pop, drcs] = nibbles(data, 2 * i, 2);
    if (pop < 0 || drcs < 0 || index > 0xff) return;
    m.popLut[index] = pop & 7;
    m.drcsLut[index] = drcs & 7;
  };
  // Packets 1-8: pages x0-x9 of two tens each; 9-14: the hex pages in between.
  for (let packet = 1; packet <= 8; packet++) {
    const data = mot.packets.get(packetKey(packet));
    if (!data) continue;
    for (let i = 0; i < 20; i++) lut(((packet - 1) << 5) + i + (i >= 10 ? 6 : 0), data, i);
  }
  for (let packet = 9; packet <= 14; packet++) {
    const data = mot.packets.get(packetKey(packet));
    if (!data) continue;
    let index = (packet - 9) * 0x30 + 10;
    for (let i = 0; i < 20; i++, index++) {
      if (i === 6 || i === 12) {
        if (index === 0x100) break;
        index += 10;
      }
      lut(index, data, i);
    }
  }
  for (const packet of [19, 20]) {
    const data = mot.packets.get(packetKey(packet));
    if (!data) continue;
    for (let i = 0; i < 4; i++) {
      const n = nibbles(data, i * 10, 10);
      if (n.some((x) => x < 0)) continue;
      m.pop[(packet - 19) * 4 + i] = {
        page: linkPage(n),
        defaults: [
          { type: n[5] & 3, address: (n[7] << 4) | n[6] },
          { type: n[5] >> 2, address: (n[9] << 4) | n[8] },
        ],
      };
    }
  }
  const drcs = mot.packets.get(packetKey(21));
  if (drcs) {
    for (let i = 0; i < 8; i++) {
      const n = nibbles(drcs, i * 4, 4);
      if (n.some((x) => x < 0)) continue;
      m.drcs[i] = linkPage(n);
    }
  }
  for (const list of [m.pop, m.drcs] as (PopLink | number | null)[][]) {
    list.forEach((l, i) => {
      const no = typeof l === "number" ? l : l?.page;
      if (no !== undefined && NO_PAGE(no)) list[i] = null;
    });
  }
  return m;
};

/** Triplet space of an object page: packets 3-25, then 26/0-15 (§10.5.1). */
const POP_TRIPLETS = (23 + 16) * 13;
const END: Triplet = { address: 63, mode: 0x1f, data: 0 };

export type PopPage = {
  /** pointers[packet 0-3][triplet 0-12][half 0-1]: index into `triplets`. */
  pointers: (number | null)[][][];
  triplets: Triplet[];
};

const tripletsOf = (data: Uint8Array) => {
  const out: number[] = [];
  for (let i = 0; i < 13; i++)
    out.push(unham2418(data[1 + 3 * i], data[2 + 3 * i], data[3 + 3 * i]));
  return out;
};

export const parsePop = (page: Page): PopPage => {
  const pointers = Array.from({ length: 4 }, () =>
    Array.from({ length: 13 }, () => [null, null] as (number | null)[]),
  );
  const triplets: Triplet[] = new Array(POP_TRIPLETS).fill(END);
  const objects = (base: number, words: number[]) =>
    words.forEach((w, i) => {
      triplets[base + i] = { address: w & 0x3f, mode: (w >> 6) & 0x1f, data: w >> 11 };
    });
  for (let packet = 1; packet <= 25; packet++) {
    const data = page.packets.get(packetKey(packet));
    if (!data) continue;
    const designation = unham84(data[0]);
    if (designation < 0) continue;
    const words = tripletsOf(data);
    // Odd designations in packets 1-4 hold pointers; packets 1 and 2 hold nothing else.
    if (packet <= 4 && designation & 1) {
      for (let i = 1; i < 13; i++) pointers[packet - 1][i] = [words[i] & 0x1ff, words[i] >> 9];
    } else if (packet >= 3) objects((packet - 3) * 13, words);
  }
  for (let d = 0; d < 16; d++) {
    const data = page.packets.get(packetKey(26, d));
    if (data) objects((23 + d) * 13, tripletsOf(data));
  }
  return { pointers, triplets };
};

/**
 * The triplets of an object of `type` (1-3) that an invocation with `address`
 * ((address << 7) | data of the invocation triplet) refers to, from just after its
 * definition; null if the page doesn't define it (§13.3).
 */
export const resolveObject = (pop: PopPage, type: number, address: number) => {
  const packet = (address >> 7) & 3;
  const triplet = ((address >> 5) & 3) * 3 + type;
  const pointer = pop.pointers[packet][triplet]?.[(address >> 4) & 1];
  if (pointer === null || pointer === undefined || pointer >= POP_TRIPLETS) return null;
  const def = pop.triplets[pointer];
  // The definition repeats the invocation's object number and type.
  if (def.mode !== type + 0x14 || ((address ^ (def.address << 7) ^ def.data) & 0x1ff) !== 0) {
    return null;
  }
  return pop.triplets.slice(pointer + 1);
};

/**
 * The links of a page's X/27/4 packet (§10.6.4 order: GPOP, POP, GDRCS, DRCS), as
 * libzvbi decodes them; null where there's none. libzvbi and the generator place the tens
 * and magazine bits differently, so a link is "none" when either reading says so (the
 * generator only links pages with tens digit 0, which both read the same).
 */
export const pageLinks = (page: Page): (number | null)[] => {
  const out: (number | null)[] = [null, null, null, null];
  const words = page.x27links;
  for (let i = 0; i < 4 && 2 * i < words.length; i++) {
    const w = words[2 * i];
    const mag = ((w >> 12) & 7) ^ (page.magazine & 7) || 8;
    const no = (mag << 8) | ((w >> 11) & 0xf0) | ((w >> 7) & 0x0f);
    if (!NO_PAGE(no) && ((w >> 7) & 0xff) !== 0xff) out[i] = no;
  }
  return out;
};
