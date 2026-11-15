import { ACTIVE, compose, drcsFromRows, type Enhancements, type Screen } from "./compose";
import type { Page, Triplet } from "./decode";
import { pageLinks, parseMot, parsePop, resolveObject, type Mot, type PopPage } from "./magazine";
import type { TeletextStore } from "./store";

// Parsed data pages, kept for as long as the page object lives.
const mots = new WeakMap<Page, Mot>();
const pops = new WeakMap<Page, PopPage>();
const cached = <T>(map: WeakMap<Page, T>, page: Page, parse: (_p: Page) => T) => {
  let v = map.get(page);
  if (!v) map.set(page, (v = parse(page)));
  return v;
};

/**
 * What `page` may refer to on other pages: its DRCS and object pages, through its own
 * X/27/4 links or else its magazine's MOT (page mFE), and the MOT's M/29 defaults.
 */
const enhancementsFor = (store: TeletextStore, page: Page): Enhancements => {
  const motPage = store.dataPage((page.magazine << 8) | 0xfe);
  const mot = motPage ? cached(mots, motPage, parseMot) : null;
  const own = page.page;
  const [gpopLink, popLink, gdrcsLink] = pageLinks(page);
  const popNo = popLink ?? (mot?.popLut[own] ? mot.pop[mot.popLut[own]]?.page : null) ?? null;
  const gpopNo = gpopLink ?? mot?.pop[0]?.page ?? null;
  // libzvbi takes the normal DRCS page from the POP link too.
  const drcsNo = popLink ?? (mot?.drcsLut[own] ? mot.drcs[mot.drcsLut[own]] : null) ?? null;
  const gdrcsNo = gdrcsLink ?? mot?.drcs[0] ?? null;
  const pop = (no: number | null, s1: number) => {
    const p = no === null ? null : store.dataPage(no, s1);
    return p ? cached(pops, p, parsePop) : null;
  };
  return {
    drcs: (global, s1, ptu) => {
      const no = global ? gdrcsNo : drcsNo;
      const d = no === null ? null : store.dataPage(no, s1);
      return d ? drcsFromRows(d.rows, ptu) : null;
    },
    object: (source, type, address) => {
      const p = pop(source === 3 ? gpopNo : popNo, address & 15);
      return p ? resolveObject(p, type, address) : null;
    },
    defaults: () => {
      const link = mot?.popLut[own] ? mot.pop[mot.popLut[own]] : null;
      if (!link) return null;
      const out: { type: number; triplets: Triplet[] }[] = [];
      // Lower types first: an active object, then an adaptive or passive one over it.
      for (const d of [...link.defaults].sort((a, b) => a.type - b.type)) {
        if (d.type < ACTIVE) continue;
        const p = pop(link.page, d.address & 15);
        const triplets = p ? resolveObject(p, d.type, d.address) : null;
        if (!triplets) return null;
        out.push({ type: d.type, triplets });
      }
      return out;
    },
    magazine: motPage?.x29.get(0) ?? null,
  };
};

export const buildScreen = (
  store: TeletextStore,
  page: Page,
  row0: Uint8Array,
  level: 1 | 2.5 = 2.5,
): Screen => compose(page, row0, enhancementsFor(store, page), level);

const clock = new Intl.DateTimeFormat("nb-NO", {
  timeZone: "Europe/Oslo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** "dd.mm hh:mm:ss" in Oslo time. */
export const clockText = (now: Date) => {
  const p = Object.fromEntries(clock.formatToParts(now).map((x) => [x.type, x.value]));
  return `${p.day}.${p.month} ${p.hour}:${p.minute}:${p.second}`;
};

/**
 * The header row as a decoder shows it: its own status (the page number being looked
 * for) in columns 0-7, then the page's header text with a running clock.
 */
export const headerRow = (header: Uint8Array | null, status: string, now: Date) => {
  const row = new Uint8Array(40).fill(0x20);
  for (let i = 0; i < Math.min(8, status.length); i++) row[i] = status.charCodeAt(i) & 0x7f;
  if (header) row.set(header.subarray(0, 32), 8);
  const text = clockText(now);
  // ttxd ends the header with "dd.mm hh:mm:ss".
  const tail = String.fromCharCode(...row.subarray(40 - text.length));
  if (/^\d\d\.\d\d \d\d:\d\d:\d\d$/.test(tail) || !header) {
    for (let i = 0; i < text.length; i++) row[40 - text.length + i] = text.charCodeAt(i);
  }
  return row;
};
