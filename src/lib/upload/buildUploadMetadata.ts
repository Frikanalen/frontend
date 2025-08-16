export const buildUploadMetadata = (
  file: File | null,
  videoId: string,
  uploadToken: string,
): Record<string, string> | undefined => {
  if (!file) return undefined;
  return {
    origFileName: file.name,
    videoID: videoId,
    uploadToken,
  };
};
