import { useEffect, useEffectEvent, useState } from "react";

import { ProgramImage } from "@/generated/frikanalenDjangoAPI.schemas";
import { videosImagesList } from "@/generated/videos/videos";

/** How often to look for the new image, and for how long, before saying it got stuck. */
export const POLL_INTERVAL_MS = 1500;
export const GIVE_UP_AFTER_MS = 60_000;

/**
 * After an upload, ingest checks the file is a real image, archives it and
 * registers it with the API, all on its own after the upload itself has
 * finished. Nothing reports back to the browser when that is done or when it
 * fails, so this watches the video's image list for an image that was not
 * there before.
 *
 * - `idle`: nothing uploaded yet.
 * - `processing`: uploaded, waiting for the image to show up.
 * - `ready`: the new image is registered.
 * - `stalled`: it never showed up; ingest most likely rejected the file.
 */
export type NewImageState = "idle" | "processing" | "ready" | "stalled";

/**
 * @param uploaded the file whose upload just finished, or null while none has.
 * @param knownImages the images the page already shows; anything else is the new one.
 * @param onReady called once when the new image is registered.
 */
export function useNewProgramImage(
  videoId: number,
  uploaded: File | null,
  knownImages: ProgramImage[],
  onReady: () => void,
): NewImageState {
  // How the watch for `file` ended; while it is for another file, that watch is still going.
  const [outcome, setOutcome] = useState<{ file: File; state: "ready" | "stalled" }>();
  const knownIds = useEffectEvent(() => new Set(knownImages.map(({ id }) => id)));
  const announceReady = useEffectEvent(onReady);

  useEffect(() => {
    if (!uploaded) return;
    const known = knownIds();
    let timer: ReturnType<typeof setTimeout>;
    const deadline = Date.now() + GIVE_UP_AFTER_MS;
    const controller = new AbortController();

    const look = async () => {
      try {
        const { data } = await videosImagesList(
          videoId,
          { limit: 100 },
          undefined,
          controller.signal,
        );
        if (data.results.some(({ id }) => !known.has(id))) {
          setOutcome({ file: uploaded, state: "ready" });
          announceReady();
          return;
        }
      } catch {
        // A failed look is just a look that found nothing, unless it was
        // called off; keep going until the deadline.
      }
      if (controller.signal.aborted) return;
      if (Date.now() >= deadline) {
        setOutcome({ file: uploaded, state: "stalled" });
        return;
      }
      timer = setTimeout(look, POLL_INTERVAL_MS);
    };
    timer = setTimeout(look, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [videoId, uploaded]);

  if (!uploaded) return "idle";
  return outcome?.file === uploaded ? outcome.state : "processing";
}

/**
 * Whether the browser can decode the file as an image at all. Catches the
 * files ingest would reject anyway (a renamed PDF, a truncated download)
 * before they are uploaded, so the member hears about it straight away.
 */
export async function isDecodableImage(file: File): Promise<boolean> {
  if (typeof createImageBitmap !== "function") return true;
  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    return true;
  } catch {
    return false;
  }
}
