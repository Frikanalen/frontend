/**
 * Files chosen on "Ny video", held for the video's own page to upload.
 *
 * The video is created first and the member is taken straight to its page,
 * where the details are filled in while the file goes up. A File cannot ride
 * in a URL, but a client-side navigation keeps the page's JavaScript alive,
 * so a module-level map carries it across. A reload drops it, and the video
 * page then simply asks for the file again.
 */
const pending = new Map<number, File>();

export const stashUpload = (videoId: number, file: File) => {
  pending.set(videoId, file);
};

/** The file waiting for this video, if any. Read during render. */
export const peekUpload = (videoId: number) => pending.get(videoId);

/** Done with it: a later visit to the page must not upload it again. */
export const clearUpload = (videoId: number) => {
  pending.delete(videoId);
};
