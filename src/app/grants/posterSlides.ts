/**
 * How a text poster splits into slides and how long it takes to read: the
 * rule the on-air graphics (src/core/posterSlides.ts) and Django
 * (scheduling/posters.py) use, so the shortest length offered here is the
 * one the API accepts.
 *
 * A blank line starts a new slide. A slide takes SLIDE_SECONDS plus
 * WORD_SECONDS a word; the heading is read on the first slide.
 */
export const SLIDE_SECONDS = 3;
export const WORD_SECONDS = 0.4;
export const POSTER_SHORTEST_SECONDS = 5;
export const MOST_SLIDES = 6;
export const SLIDE_LENGTH = 400;

export const posterSlides = (text: string): string[] => {
  const slides = text
    .replace(/\r\n/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((slide) => slide.trim())
    .filter(Boolean);
  return slides.length ? slides : [""];
};

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** The shortest the poster may be listed for: every slide read once. */
export const posterMinimumSeconds = (heading: string, text: string): number => {
  // Summed in tenths, so float error can't round 6.0 s up to 7.
  const tenths = posterSlides(text).reduce(
    (sum, slide, index) =>
      sum +
      10 * SLIDE_SECONDS +
      10 * WORD_SECONDS * (words(slide) + (index === 0 ? words(heading) : 0)),
    0,
  );
  return Math.max(POSTER_SHORTEST_SECONDS, Math.ceil(Math.round(tenths) / 10));
};

/** What's wrong with the text's slides, if anything. */
export const slideProblem = (text: string): string | null => {
  const slides = posterSlides(text);
  if (slides.length > MOST_SLIDES) return `En plakat kan ha høyst ${MOST_SLIDES} sider.`;
  const long = slides.findIndex((slide) => slide.length > SLIDE_LENGTH);
  return long < 0
    ? null
    : `Side ${long + 1} har ${slides[long].length} tegn; en side har plass til ${SLIDE_LENGTH}.`;
};
