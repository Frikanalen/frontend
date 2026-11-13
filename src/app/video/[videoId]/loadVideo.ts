import { cache } from "react";
import { headers } from "next/headers";
import { ssrVideosRetrieve } from "@/generated/ssr/videos/videos";

const retrieve = cache((videoId: number, cookie: string) =>
  ssrVideosRetrieve(videoId, {
    headers: cookie ? { Cookie: cookie } : {},
    cache: "no-store",
    next: { tags: [`video:${videoId}`] },
  }),
);

/**
 * The video as the visitor may see it, fetched once per request: the page and
 * its metadata used to ask Django for it separately.
 */
export const loadVideo = async (videoId: number) =>
  retrieve(videoId, (await headers()).get("cookie") ?? "");
