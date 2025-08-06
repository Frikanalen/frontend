export interface TusUploadState {
  isUploading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isReady: boolean; // A file has been selected and is ready to upload
  progress: number;
  url: string | null;
  error: Error | null;
  file: File | null;
}

export type TusUploadAction =
  | { type: "start" }
  | { type: "progress"; percent: number }
  | { type: "success"; message: string | null }
  | { type: "error"; error: Error }
  | { type: "abort" }
  | { type: "setFileList"; fileList: FileList | null };

export const tusUploadInitialState: TusUploadState = {
  isUploading: false,
  isSuccess: false,
  isError: false,
  isReady: false,
  file: null,
  progress: 0,
  url: null,
  error: null,
};

export function tusUploadReducer(
  state: TusUploadState,
  action: TusUploadAction,
): TusUploadState {
  switch (action.type) {
    case "start":
      return {
        ...tusUploadInitialState,
        isUploading: true,
      };
    case "progress":
      return {
        ...state,
        progress: action.percent,
      };
    case "success":
      return {
        ...state,
        isUploading: false,
        isSuccess: true,
        url: action.message,
      };
    case "error":
      return {
        ...state,
        isUploading: false,
        isError: true,
        isReady: true,
        error: action.error,
      };
    case "abort":
      return {
        ...state,
        isUploading: false,
        progress: 0,
      };
    case "setFileList":
      if (action.fileList?.length == 1) {
        return {
          ...tusUploadInitialState,
          isReady: true,
          file: action.fileList[0],
        };
      } else {
        return { ...tusUploadInitialState };
      }

    default:
      return state;
  }
}
