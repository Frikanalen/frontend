export const buildUploadMetadata = (
  file: File | null,
  videoId: string,
  uploadToken: string,
  additionalMetadata: Record<string, string> = {},
): Record<string, string> | undefined => {
  if (!file) return undefined;
  return {
    ...additionalMetadata,
    origFileName: file.name,
    videoID: videoId,
    uploadToken,
  };
};
