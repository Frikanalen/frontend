"use server";

import { revalidateTag, updateTag } from "next/cache";

export const editAction = async (videoId: number) => {
  // The editor should see their change on the video page at once, so its
  // cached copy is expired rather than refreshed in the background. Lists the
  // video appears in (archive, front page, series) catch up behind it.
  updateTag(`video:${videoId}`);
  revalidateTag("videos", "max");
};
