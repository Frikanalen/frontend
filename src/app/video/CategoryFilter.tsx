import Link from "next/link";
import { ssrCategoriesList } from "@/generated/ssr/categories/categories";
import { archiveSearchUrl } from "@/app/video/archiveSearchUrl";

/**
 * Ten or so today, but the endpoint paginates, so the whole list has to be
 * asked for rather than assumed to fit in one default page.
 */
const CATEGORY_LIMIT = 100;

const HEADING_ID = "archive-categories";

const chipClassName = (isActive: boolean) =>
  `inline-block rounded-full px-3 py-1.5 text-small ring-1 ${
    isActive
      ? "bg-primary text-primary-foreground ring-primary"
      : "bg-background ring-default-300 hover:bg-content2"
  }`;

/**
 * The archive's second way in, for visitors who have nothing to type: the ten
 * categories, each carrying its own video count.
 *
 * `videocount` comes off the category itself, so the counts cost no extra
 * request, and they match what the filtered search returns - both sides count
 * the same publicly visible, properly imported videos.
 *
 * Chips keep the current query, so picking one narrows the search that is
 * already on screen instead of throwing it away.
 */
export const CategoryFilter = async ({
  query,
  activeCategory,
}: {
  query: string;
  activeCategory: string;
}) => {
  // A missing category list costs the visitor a way in, not the page: the
  // search box above still works, so this section simply isn't drawn.
  const response = await ssrCategoriesList(
    { limit: CATEGORY_LIMIT },
    { next: { revalidate: 3600 } },
  ).catch((error: unknown) => {
    console.error("Archive categories could not be fetched:", error);
    return null;
  });

  if (response?.status !== 200) return null;

  // An empty category is a chip that leads nowhere, so it isn't offered.
  const categories = response.data.results.filter((category) => category.videocount > 0);

  if (!categories.length) return null;

  return (
    <section aria-labelledby={HEADING_ID} className="space-y-3">
      <h2 id={HEADING_ID} className="text-lg font-bold">
        Kategorier
      </h2>

      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={archiveSearchUrl({ query })}
            aria-current={activeCategory ? undefined : "true"}
            className={chipClassName(!activeCategory)}
          >
            Alle
          </Link>
        </li>

        {categories.map((category) => {
          const isActive = category.name === activeCategory;

          return (
            <li key={category.id}>
              <Link
                href={archiveSearchUrl({ query, category: category.name })}
                // The count is drawn as a bare number, which reads as a stray
                // digit out loud. Spelling it out here keeps the visible name
                // inside the accessible one, as the two have to match.
                aria-label={`${category.name}, ${category.videocount} videoer`}
                aria-current={isActive ? "true" : undefined}
                className={chipClassName(isActive)}
              >
                {category.name}{" "}
                <span aria-hidden className={isActive ? "opacity-75" : "text-foreground/75"}>
                  {category.videocount}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
