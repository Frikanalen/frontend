import { durationMilliseconds } from "@/app/grants/duration";
import type { Recipe } from "@/generated/frikanalenDjangoAPI.schemas";

/** What narrows a jukebox slot's draw. Lengths in minutes; null is no limit. */
export type Theme = {
  name: string;
  categories: number[];
  shortest: number | null;
  longest: number | null;
  newerThanDays: number | null;
  olderThanDays: number | null;
};

const NO_THEME: Theme = {
  name: "",
  categories: [],
  shortest: null,
  longest: null,
  newerThanDays: null,
  olderThanDays: null,
};

const minutesOf = (duration: string | null | undefined) => {
  const milliseconds = duration ? durationMilliseconds(duration) : null;
  return milliseconds ? Math.round(milliseconds / 60_000) : null;
};

export const themeOf = (recipe: Recipe | null | undefined): Theme =>
  recipe?.kind === "jukebox"
    ? {
        name: recipe.name ?? "",
        categories: [...(recipe.categories ?? [])].sort((a, b) => a - b),
        shortest: minutesOf(recipe.shortest),
        longest: minutesOf(recipe.longest),
        newerThanDays: recipe.newerThanDays ?? null,
        olderThanDays: recipe.olderThanDays ?? null,
      }
    : NO_THEME;

export const sameTheme = (a: Theme, b: Theme) =>
  JSON.stringify({ ...a, name: a.name.trim() }) === JSON.stringify({ ...b, name: b.name.trim() });

/** Why a theme can't be saved, if it can't. */
export const themeProblem = (theme: Theme) =>
  theme.shortest !== null && theme.longest !== null && theme.shortest > theme.longest
    ? "Den korteste lengden er lengre enn den lengste."
    : theme.newerThanDays !== null &&
        theme.olderThanDays !== null &&
        theme.olderThanDays >= theme.newerThanDays
      ? "Ingen video er både nyere og eldre enn det du har valgt."
      : null;
