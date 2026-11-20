import { redirect } from "next/navigation";
import { VideoParams, parseParamsOr404 } from "@/lib/routeParams";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

/** The file is uploaded on the video's own page now; old links land there. */
export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await parseParamsOr404(VideoParams, params);
  redirect(`/video/${videoId}/edit`);
}
