// Teletext packet decoding (ETS 300 706). A packet is 42 bytes: the magazine and row
// address (two Hamming 8/4 bytes), then 40 bytes of data.

const HAM84 = [
  0x15, 0x02, 0x49, 0x5e, 0x64, 0x73, 0x38, 0x2f, 0xd0, 0xc7, 0x8c, 0x9b, 0xa1, 0xb6, 0xfd, 0xea,
];
const UNHAM84 = new Int8Array(256).fill(-1);
HAM84.forEach((code, n) => {
  UNHAM84[code] = n;
  // Correct single-bit errors, as a decoder does.
  for (let bit = 0; bit < 8; bit++) UNHAM84[code ^ (1 << bit)] = n;
});

/** Hamming 8/4: a nibble, or -1 for an uncorrectable byte. */
export const unham84 = (b: number) => UNHAM84[b];

/** Hamming 24/18: the 18 data bits of three bytes (first transmitted first). */
export const unham2418 = (b0: number, b1: number, b2: number) =>
  ((b0 >> 2) & 1) | (((b0 >> 4) & 7) << 1) | ((b1 & 0x7f) << 4) | ((b2 & 0x7f) << 11);

/** An enhancement triplet: address 0-63, mode 0-31, data 0-127. */
export type Triplet = { address: number; mode: number; data: number };

const triplet = (w: number): Triplet => ({
  address: w & 0x3f,
  mode: (w >> 6) & 0x1f,
  data: w >> 11,
});

export type Link = { page: number; subcode: number };

/** One page transmission, as a decoder assembles it. */
export type Page = {
  magazine: number; // 1-8
  page: number; // 0x00-0xFF within the magazine
  subcode: number;
  erase: boolean; // C4
  newsflash: boolean; // C5
  subtitle: boolean; // C6
  suppressHeader: boolean; // C7
  inhibit: boolean; // C10
  national: number; // C12-C14
  header: Uint8Array; // 32 bytes, parity stripped
  /** Rows 1-24 (index 0 unused); null = not sent. Parity stripped (bit 7 cleared). */
  rows: (Uint8Array | null)[];
  /** X/26 triplets in transmission order (designations 0-15). */
  x26: Triplet[];
  /** X/27/0: red, green, yellow, cyan, (next), index. */
  fastext: (Link | null)[];
  /** X/27/4-5 links, decoded as 18-bit words. */
  x27links: number[];
  /** X/28 packets by designation, 13 triplets each. */
  x28: Map<number, number[]>;
  /** M/29 packets by designation (magazine defaults, sent with the MOT page). */
  x29: Map<number, number[]>;
  /**
   * Packets 1-25 and 26 as received (40 bytes after the address, parity and Hamming
   * intact), keyed by `packetKey`: MOT and object pages carry Hamming coded data in them.
   */
  packets: Map<number, Uint8Array>;
};

/** Key into `Page.packets`: packets 1-25 by number, X/26 by designation too. */
export const packetKey = (packet: number, designation = 0) => (packet << 4) | designation;

const stripParity = (src: Uint8Array, from: number, to: number) => {
  const out = new Uint8Array(to - from);
  for (let i = from; i < to; i++) out[i - from] = src[i] & 0x7f;
  return out;
};

const words = (p: Uint8Array) => {
  const out: number[] = [];
  for (let i = 3; i + 2 < 42; i += 3) out.push(unham2418(p[i], p[i + 1], p[i + 2]));
  return out;
};

/** Magazine (1-8) and packet number (0-31). */
export const address = (p: Uint8Array): [number, number] => {
  const a = unham84(p[0]);
  const b = unham84(p[1]);
  return [a & 7 || 8, (a >> 3) | (b << 1)];
};

const fastextLinks = (p: Uint8Array, magazine: number): (Link | null)[] => {
  const links: (Link | null)[] = [];
  for (let i = 0; i < 6; i++) {
    const n = Array.from({ length: 6 }, (_, k) => unham84(p[3 + 6 * i + k]));
    const page = (n[1] << 4) | n[0];
    const mag = (magazine ^ (((n[3] >> 3) & 1) | ((n[5] >> 1) & 6))) & 7 || 8;
    const subcode = n[2] | ((n[3] & 7) << 4) | (n[4] << 8) | ((n[5] & 3) << 12);
    links.push(page === 0xff ? null : { page: (mag << 8) | page, subcode });
  }
  return links;
};

/** Decode one page transmission: a header packet followed by its packets. */
export const decodePage = (bytes: Uint8Array): Page | null => {
  if (bytes.length < 42) return null;
  const [magazine, packet] = address(bytes);
  if (packet !== 0) return null;
  const n = Array.from({ length: 8 }, (_, i) => unham84(bytes[2 + i]));
  if (n.some((x) => x < 0)) return null;
  const page: Page = {
    magazine,
    page: (n[1] << 4) | n[0],
    subcode: n[2] | ((n[3] & 7) << 4) | (n[4] << 8) | ((n[5] & 3) << 12),
    erase: !!(n[3] & 8),
    newsflash: !!(n[5] & 4),
    subtitle: !!(n[5] & 8),
    suppressHeader: !!(n[6] & 1),
    inhibit: !!(n[6] & 8),
    national: (n[7] >> 1) & 7,
    header: stripParity(bytes, 10, 42),
    rows: new Array(25).fill(null),
    x26: [],
    fastext: [],
    x27links: [],
    x28: new Map(),
    x29: new Map(),
    packets: new Map(),
  };
  for (let off = 42; off + 42 <= bytes.length; off += 42) {
    const p = bytes.subarray(off, off + 42);
    const [, row] = address(p);
    if (row >= 1 && row <= 24) page.rows[row] = stripParity(p, 2, 42);
    if (row >= 1 && row <= 25) page.packets.set(packetKey(row), p.slice(2));
    else if (row >= 26 && row <= 29) {
      const designation = unham84(p[2]);
      if (row === 26) {
        page.x26.push(...words(p).map(triplet));
        if (designation >= 0) page.packets.set(packetKey(26, designation), p.slice(2));
      } else if (row === 27 && designation === 0) page.fastext = fastextLinks(p, magazine);
      else if (row === 27 && (designation === 4 || designation === 5)) {
        page.x27links.push(...words(p));
      } else if (row === 28) page.x28.set(designation, words(p));
      else if (row === 29) page.x29.set(designation, words(p));
    }
  }
  return page;
};

/** Merge a later transmission of the same page into an earlier one (rows that were not
 * resent stay, unless the new one erases the page). */
export const mergePage = (old: Page, update: Page): Page => {
  if (update.erase) return update;
  return {
    ...update,
    rows: update.rows.map((r, i) => r ?? old.rows[i]),
    x26: update.x26.length ? update.x26 : old.x26,
    fastext: update.fastext.length ? update.fastext : old.fastext,
    x27links: update.x27links.length ? update.x27links : old.x27links,
    x28: update.x28.size ? update.x28 : old.x28,
    x29: update.x29.size ? update.x29 : old.x29,
    packets: new Map([...old.packets, ...update.packets]),
  };
};

export const decodeBase64 = (s: string) => {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

/** Page number as shown, e.g. 0x100 -> "100". */
export const pageName = (n: number) => n.toString(16).toUpperCase().padStart(3, "0");
