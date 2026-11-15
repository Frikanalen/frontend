import { compose, drcsFromRows, type Screen } from "./compose";
import type { Page } from "./decode";
import type { TeletextStore } from "./store";

/**
 * The normal DRCS page an X/27/4 packet links to. Each link is two words (page, subcode);
 * the page word holds the link function in bits 0-1 (3 = normal DRCS, 1 = POP, where
 * libzvbi also looks), page units in bits 7-10 and tens in bits 11-14, in the page's own
 * magazine. The generator only uses DRCS pages with tens digit 0, which every reading of
 * this field agrees on.
 */
export const drcsPage = (page: Page): number | null => {
  const links = page.x27links;
  let found: number | null = null;
  for (let i = 0; i + 1 < links.length; i += 2) {
    const w = links[i];
    const fn = w & 3;
    const num = (((w >> 11) & 15) << 4) | ((w >> 7) & 15);
    if (num === 0xff || (fn !== 3 && fn !== 1)) continue;
    if (fn === 3 || found === null) found = (page.magazine << 8) | num;
  }
  return found;
};

export const buildScreen = (
  store: TeletextStore,
  page: Page,
  row0: Uint8Array,
  level: 1 | 2.5 = 2.5,
): Screen => {
  const drcsNo = drcsPage(page);
  const lookup =
    drcsNo === null
      ? null
      : (sub: number, ptu: number) => {
          const d = store.drcs(drcsNo, sub);
          return d ? drcsFromRows(d.rows, ptu) : null;
        };
  return compose(page, row0, lookup, level);
};

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
