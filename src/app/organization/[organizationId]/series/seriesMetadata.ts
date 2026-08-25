export type SeriesMetadataState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type SeriesMetadataAction = (
  _state: SeriesMetadataState,
  _formData: FormData,
) => Promise<SeriesMetadataState>;
