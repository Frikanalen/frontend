"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export const editAction = async (videoId: number) => {
  revalidateTag(`video:${videoId}`);
  revalidatePath(`/video/${videoId}`);
  revalidatePath(`${process.env.NEXT_PUBLIC_DJANGO_URL}api/videos/${videoId}`);
};
