"use client";
// The teletext viewer over the live player. Loaded only when someone presses the
// teletext button: this module, the decoder, the font and the feed connection all stay
// out of the normal page load.

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { pageName, type Page } from "./decode";
import { buildScreen, headerRow } from "./screen";
import { HEIGHT, WIDTH, render } from "./render";
import { MixIcon, RevealIcon, TvIcon } from "./icons";
import { teletextStore } from "./store";

const FIRST_PAGE = 0x100;

const emptyPage = (no: number): Page => ({
  magazine: no >> 8,
  page: no & 0xff,
  subcode: 0,
  erase: true,
  newsflash: false,
  subtitle: false,
  suppressHeader: false,
  inhibit: false,
  national: 2,
  header: new Uint8Array(32).fill(0x20),
  rows: new Array(25).fill(null),
  x26: [],
  fastext: [],
  x27links: [],
  x28: new Map(),
  x29: new Map(),
  packets: new Map(),
});

const FASTEXT = [
  { name: "Rød", colour: "#e00000", key: "r" },
  { name: "Grønn", colour: "#00b000", key: "g" },
  { name: "Gul", colour: "#e0e000", key: "y" },
  { name: "Blå", colour: "#00b0e0", key: "b" },
];

// The symbols are yellow, as printed on the remotes they come from.
const ICON = "size-5 text-yellow-300 sm:size-6";

const Key = ({
  children,
  onPress,
  label,
  className = "",
  pressed,
  colour,
}: {
  children: React.ReactNode;
  onPress: () => void;
  label?: string;
  className?: string;
  pressed?: boolean;
  colour?: string;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={pressed}
    onClick={onPress}
    style={colour ? { backgroundColor: colour } : undefined}
    className={`flex items-center justify-center rounded-xs text-xs font-semibold text-white tabular-nums focus-visible:outline-2 focus-visible:outline-white sm:text-sm ${colour ? "hover:brightness-125" : "bg-white/15 hover:bg-white/30"} ${pressed ? "ring-2 ring-white" : ""} ${className || "min-h-6 min-w-6 px-1 sm:min-h-8 sm:min-w-8"}`}
  >
    {children}
  </button>
);

export default function TeletextViewer({ onClose }: { onClose: () => void }) {
  const store = teletextStore();
  const version = useSyncExternalStore(store.subscribe, store.getVersion, () => 0);
  const [pageNo, setPageNo] = useState(FIRST_PAGE);
  const [entry, setEntry] = useState("");
  const [reveal, setReveal] = useState(false);
  const [mix, setMix] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // When the page came up: the carousel position follows from it.
  const [shownAt, setShownAt] = useState(() => Date.now());
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    root.current?.focus();
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const stored = store.page(pageNo, now);
  // The carousel: the next subpage every cycle_secs.
  const current: Page | null = stored
    ? stored.subpages[
        Math.floor((now - shownAt) / (stored.cycleSecs * 1000)) % stored.subpages.length
      ]
    : null;

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const date = new Date(now);
    const status = entry ? `P${entry.padEnd(3, "-")}` : `P${pageName(pageNo)}`;
    const page = current ?? emptyPage(pageNo);
    // While a page is being looked for, the header keeps rolling with another page's.
    const header =
      current?.header ?? store.pages.values().next().value?.subpages[0]?.header ?? null;
    const row0 = headerRow(header, status.padEnd(8, " "), date);
    const screen = buildScreen(store, page, row0);
    const image = ctx.createImageData(WIDTH, HEIGHT);
    render(screen, new Uint32Array(image.data.buffer), {
      flashOn: now % 1000 < 750,
      reveal,
      mix,
    });
    ctx.putImageData(image, 0, 0);
    // version: redraw when the feed changes.
  }, [store, current, pageNo, entry, now, reveal, mix, version]);

  const go = (no: number) => {
    setPageNo(no);
    setEntry("");
    setReveal(false);
    setShownAt(now);
  };

  const digit = (d: string) => {
    const next = entry + d;
    if (next.length === 1 && (d === "0" || d === "9")) return; // magazines 1-8
    if (next.length === 3) go(parseInt(next, 16));
    else setEntry(next);
  };

  const step = (dir: 1 | -1) => {
    const numbers = [...store.pages.keys()]
      .filter((n) => store.page(n) && (n & 0xff) < 0xa0 && (n & 0x0f) < 0x0a)
      .sort((a, b) => a - b);
    if (!numbers.length) return;
    const i =
      dir > 0 ? numbers.findIndex((n) => n > pageNo) : numbers.findLastIndex((n) => n < pageNo);
    go(i >= 0 ? numbers[i] : numbers[dir > 0 ? 0 : numbers.length - 1]);
  };

  const fastext = (i: number) => {
    const link = current?.fastext[i];
    if (link) go(link.page);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    let handled = true;
    if (/^[0-9]$/.test(k)) digit(k);
    else if (k === "Escape") onClose();
    else if (k === "ArrowRight" || k === "ArrowUp" || k === "+") step(1);
    else if (k === "ArrowLeft" || k === "ArrowDown" || k === "-") step(-1);
    else if (k === "?") setReveal((v) => !v);
    else if (k === "m") setMix((v) => !v);
    else if (k === "i") go(current?.fastext[5]?.page ?? FIRST_PAGE);
    else {
      const f = FASTEXT.findIndex((x) => x.key === k);
      if (f >= 0) fastext(f);
      else handled = false;
    }
    if (handled) e.preventDefault();
    // Keep the player's own shortcuts (space, f, arrows) out of it.
    e.stopPropagation();
  };

  return (
    <div
      ref={root}
      role="dialog"
      aria-label="Tekst-TV"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={`absolute inset-0 z-[60] flex items-stretch justify-center outline-none ${mix ? "bg-transparent" : "bg-black"}`}
    >
      {/* Laid out like a remote: number pad with the coloured keys under it on the left,
          the teletext keys on the right. */}
      <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-2 py-1">
        <div className="flex flex-col gap-2">
          <div
            className="grid grid-cols-[repeat(3,auto)] gap-1"
            role="group"
            aria-label="Sidenummer"
          >
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <Key key={d} onPress={() => digit(d)}>
                {d}
              </Key>
            ))}
            <Key label="Forrige side" onPress={() => step(-1)}>
              ‹
            </Key>
            <Key onPress={() => digit("0")}>0</Key>
            <Key label="Neste side" onPress={() => step(1)}>
              ›
            </Key>
          </div>
          <div className="grid grid-cols-4 gap-1" role="group" aria-label="Fargeknapper">
            {FASTEXT.map((f, i) => (
              <Key
                key={f.key}
                label={f.name}
                onPress={() => fastext(i)}
                colour={f.colour}
                className="h-3 w-full sm:h-4"
              >
                {""}
              </Key>
            ))}
          </div>
        </div>
      </div>
      {/* The page keeps 4:3 in whatever room the keys leave. */}
      <div
        className="flex h-full min-w-0 flex-1 items-center justify-center"
        style={{ containerType: "size" }}
      >
        <div
          className="relative aspect-[4/3]"
          style={{ width: "min(100cqw, calc(100cqh * 4 / 3))" }}
        >
          <canvas
            ref={canvas}
            width={WIDTH}
            height={HEIGHT}
            className="size-full"
            aria-label={`Tekst-TV side ${pageName(pageNo)}`}
          />
          {!store.connected && !store.pages.size && (
            <p className="absolute inset-x-0 bottom-2 text-center font-mono text-xs text-white/70">
              Kobler til …
            </p>
          )}
        </div>
      </div>
      <div
        className="flex shrink-0 flex-col items-center justify-center gap-1 px-2 py-1"
        role="group"
        aria-label="Tekst-TV"
      >
        <Key label="Tilbake til TV" onPress={onClose}>
          <TvIcon className={ICON} />
        </Key>
        <Key label="Vis skjult tekst" pressed={reveal} onPress={() => setReveal((v) => !v)}>
          <RevealIcon className={ICON} />
        </Key>
        <Key label="Bilde bak teksten" pressed={mix} onPress={() => setMix((v) => !v)}>
          <MixIcon className={ICON} />
        </Key>
      </div>
    </div>
  );
}
