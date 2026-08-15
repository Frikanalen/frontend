"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export const editAction = async (videoId: number) => {
  // Next 16 requires an explicit cacheLife profile. "max" keeps the previous
  // stale-while-revalidate behaviour; switch to updateTag() if the editor
  // should see their change immediately instead.
  revalidateTag(`video:${videoId}`, "max");
  revalidatePath(`/video/${videoId}`);
};
