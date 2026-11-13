import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { ssrOrganizationList } from "@/generated/ssr/organization/organization";
import { ssrVideosList } from "@/generated/ssr/videos/videos";
import type {
  Organization,
  PaginatedVideoList,
  Video,
} from "@/generated/ssr/frikanalenDjangoAPI.schemas";

const BASE_URL = "https://frikanalen.tv";
const PAGE_SIZE = 500;

const staticPaths = [
  "",
  "/about",
  "/about/contact",
  "/about/join",
  "/about/join/affidavit",
  "/about/statutes",
];

// Each list is cached for an hour. A failed request throws, and a throw is
// never cached, so a Django hiccup costs one sitemap rather than an hour of
// them.
async function getOrganizations(): Promise<Organization[]> {
  "use cache";
  cacheLife("hours");
  const organizations: Organization[] = [];
  let offset = 0;

  while (true) {
    const response = await ssrOrganizationList({ limit: PAGE_SIZE, offset, ordering: "id" });

    if (response.status !== 200) {
      throw new Error(`Organization sitemap request failed with status ${response.status}`);
    }

    organizations.push(...response.data.results);
    offset += response.data.results.length;

    if (offset >= response.data.count || response.data.results.length === 0) break;
  }

  return organizations;
}

async function getVideoPage(offset: number): Promise<PaginatedVideoList> {
  const response = await ssrVideosList({
    limit: PAGE_SIZE,
    offset,
    ordering: "id",
    publish_on_web: true,
  });

  if (response.status !== 200) {
    throw new Error(`Video sitemap request failed with status ${response.status}`);
  }

  return response.data;
}

async function getVideos(): Promise<Video[]> {
  "use cache";
  cacheLife("hours");
  const firstPage = await getVideoPage(0);
  const videos = [...firstPage.results];
  const effectivePageSize = firstPage.results.length;

  if (effectivePageSize === 0) return videos;

  const offsets = Array.from(
    { length: Math.ceil(firstPage.count / effectivePageSize) - 1 },
    (_, index) => (index + 1) * effectivePageSize,
  );

  for (let index = 0; index < offsets.length; index += 4) {
    const pages = await Promise.all(offsets.slice(index, index + 4).map(getVideoPage));
    pages.forEach((page) => videos.push(...page.results));
  }

  return videos;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Built on request rather than at build time, when Django isn't there to ask.
  await connection();
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
  }));

  const [organizations, videos] = await Promise.allSettled([getOrganizations(), getVideos()]);

  if (organizations.status === "fulfilled") {
    entries.push(
      ...organizations.value
        .filter((organization) => organization.fkmember)
        .map((organization) => ({
          url: `${BASE_URL}/organization/${organization.id}`,
        })),
    );
  } else {
    console.error("Failed to add organizations to sitemap", organizations.reason);
  }

  if (videos.status === "fulfilled") {
    entries.push(
      ...videos.value
        .filter((video) => video.publishOnWeb && video.organization.fkmember)
        .map((video) => ({
          url: `${BASE_URL}/video/${video.id}`,
          lastModified: video.updatedTime ?? video.createdTime ?? undefined,
        })),
    );
  } else {
    console.error("Failed to add videos to sitemap", videos.reason);
  }

  return entries;
}
