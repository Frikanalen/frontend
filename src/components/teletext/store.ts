// Keeps the pages from ttxd's public feed (GET /teletext/feed, Server-Sent Events; see
// docs/api.md in Frikanalen/teletext). Each page arrives as the T42 packets a decoder
// would receive.

import { decodeBase64, decodePage, mergePage, type Page } from "./decode";

export type StoredPage = {
  cycleSecs: number;
  expires: number | null;
  subpages: Page[];
};

type FeedPage = {
  page: string;
  cycle_secs: number;
  expires: number | null;
  subpages: string[];
};

const decodeAll = (p: FeedPage): StoredPage => ({
  cycleSecs: p.cycle_secs,
  expires: p.expires,
  subpages: p.subpages.map((s) => decodePage(decodeBase64(s))).filter((x): x is Page => !!x),
});

export class TeletextStore {
  pages = new Map<number, StoredPage>();
  connected = false;
  version = 0;
  private source: EventSource | null = null;
  private listeners = new Set<() => void>();

  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    if (this.listeners.size === 1) this.open();
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0) this.close();
    };
  };

  getVersion = () => this.version;

  private changed() {
    this.version++;
    this.listeners.forEach((fn) => fn());
  }

  private open() {
    const es = new EventSource(this.url);
    this.source = es;
    es.onopen = () => {
      this.connected = true;
      this.changed();
    };
    es.onerror = () => {
      // EventSource reconnects by itself; the snapshot it gets then replaces everything.
      this.connected = false;
      this.changed();
    };
    es.addEventListener("snapshot", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { pages: FeedPage[] };
      this.pages = new Map(data.pages.map((p) => [parseInt(p.page, 16), decodeAll(p)]));
      this.changed();
    });
    es.addEventListener("page", (e) => {
      const p = JSON.parse((e as MessageEvent).data) as FeedPage;
      this.pages.set(parseInt(p.page, 16), decodeAll(p));
      this.changed();
    });
    es.addEventListener("delete", (e) => {
      const p = JSON.parse((e as MessageEvent).data) as { page: string };
      this.pages.delete(parseInt(p.page, 16));
      this.changed();
    });
    es.addEventListener("subtitle", (e) => {
      const p = JSON.parse((e as MessageEvent).data) as {
        page: string;
        t: number;
        packets: string;
      };
      const page = decodePage(decodeBase64(p.packets));
      if (!page) return;
      // A subtitle page shows like any other page when keyed up.
      const no = parseInt(p.page, 16);
      const old = this.pages.get(no)?.subpages[0];
      this.pages.set(no, {
        cycleSecs: 10,
        expires: null,
        subpages: [old ? mergePage(old, page) : page],
      });
      this.changed();
    });
  }

  private close() {
    this.source?.close();
    this.source = null;
    this.connected = false;
  }

  /** The page as shown now (null if missing, expired or not for display). */
  page(no: number, now = Date.now()): StoredPage | null {
    const p = this.pages.get(no);
    if (!p || (p.expires !== null && p.expires <= now) || !p.subpages.length) return null;
    if (p.subpages.every((s) => s.inhibit)) return null;
    return p;
  }

  /**
   * A data page (DRCS, objects, MOT) by number and subpage, which is the low digit of
   * the subcode; a page with one subpage serves any.
   */
  dataPage(no: number, s1 = 0) {
    const p = this.pages.get(no);
    if (!p) return null;
    return (
      p.subpages.find((s) => (s.subcode & 15) === s1) ??
      (p.subpages.length === 1 ? p.subpages[0] : null)
    );
  }
}

let shared: TeletextStore | null = null;
export const teletextStore = () => (shared ??= new TeletextStore("/teletext/feed"));
