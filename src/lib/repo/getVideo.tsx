import { videosRetrieve } from "@/generated/videos/videos";
import { notFound } from "next/navigation";
import { Video } from "@/generated/frikanalenDjangoAPI.schemas";

export const getVideo = async (videoId: string): Promise<Video> => {
  const res = await videosRetrieve(videoId);
  if (res.status === 404) return notFound();
  console.log(res.status, res.data);
  return res.data;
};
