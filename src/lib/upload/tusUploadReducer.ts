import { TusUploadAction, TusUploadState } from "@/lib/upload/types";

export const tusUploadInitialState: TusUploadState = {
  isUploading: false,
  isSuccess: false,
  isError: false,
  isReady: false,
  file: null,
  lastResponse: null,
  progress: 0,
  url: null,
  error: null,
};

export function tusUploadReducer(state: TusUploadState, action: TusUploadAction): TusUploadState {
  switch (action.type) {
    case "start":
      return {
        ...state,
        isUploading: true,
        isReady: false,
        isSuccess: false,
        isError: false,
        progress: 0,
      };
    case "progress":
      return {
        ...state,
        progress: Math.floor((action.bytesSent / action.bytesTotal) * 100),
      };
    case "success":
      return {
        ...state,
        isError: false,
        isUploading: false,
        isReady: false,
        isSuccess: true,
        lastResponse: action.lastResponse,
        file: null,
      };
    case "error":
      return {
        ...state,
        isUploading: false,
        isSuccess: false,
        isError: true,
        isReady: false,
        error: action.error,
        file: null,
      };
    case "abort":
      return {
        ...state,
        isUploading: false,
        progress: 0,
      };
    case "setFileList":
      if (action.fileList?.length != 1) return { ...tusUploadInitialState };

      return {
        ...tusUploadInitialState,
        isReady: true,
        file: action.fileList[0],
      };
    default:
      return state;
  }
}
