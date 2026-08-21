/** Enough rows to fill a screen; the rest arrive before anyone scrolls. */
const PLACEHOLDER_ROWS = 6;

/**
 * What stands in for the results while they are being fetched.
 *
 * Built to the same geometry as a real row rather than being the line of text
 * this replaces, because the point of a placeholder is that nothing moves when
 * the real thing arrives. "Søker …" was one line tall, so every search
 * collapsed the page to nothing and then pushed it back down - and on a slow
 * connection a reader could have started reading the first result by the time
 * the reflow threw it somewhere else.
 *
 * Titles of deliberately uneven width: a stack of identical bars reads as a
 * table, and the thing being waited for is a list of sentences.
 */
const TITLE_WIDTHS = ["w-3/4", "w-1/2", "w-5/6", "w-2/3", "w-4/5", "w-3/5"];

export const ResultsSkeleton = () => (
  <div className="-mx-2 sm:-mx-3">
    <p role="status" className="sr-only">
      Henter resultater …
    </p>

    <div aria-hidden className="flex animate-pulse flex-col motion-reduce:animate-none">
      {TITLE_WIDTHS.slice(0, PLACEHOLDER_ROWS).map((width, index) => (
        <div key={index} className="flex gap-3 p-2 sm:gap-4 sm:p-3">
          <div className="aspect-video w-32 shrink-0 rounded-lg bg-content2 sm:w-44 lg:w-52" />
          <div className="flex min-w-0 grow flex-col gap-2 py-1">
            <div className={`h-4 rounded bg-content2 ${width}`} />
            <div className="h-3 w-32 rounded bg-content2/60" />
            <div className="h-3 w-40 rounded bg-content2/60" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
