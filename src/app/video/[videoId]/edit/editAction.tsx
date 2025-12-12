"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export const editAction = async (videoId: number) => {
  revalidateTag(`video:${videoId}`);
  revalidatePath(`/video/${videoId}`);
  revalidatePath(`/api-proxy/api/videos/${videoId}`);
};
