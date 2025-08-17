"use server";
import { revalidatePath } from "next/cache";

export const revalidateVideoAction = async (videoId: string) => {
  revalidatePath(`/api/video/${videoId}`);
};
