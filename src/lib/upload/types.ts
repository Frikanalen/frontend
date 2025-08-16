import * as tus from "tus-js-client";
import { ChangeEventHandler } from "react";

export interface TusUploadState {
  isUploading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isReady: boolean; // A file has been selected and is ready to upload
  lastResponse: tus.HttpResponse | null;
  progress: number;
  url: string | null;
  error: Error | null;
  file: File | null;
}

export type UseTusUploadReturn = TusUploadState & {
  onFileListChange: ChangeEventHandler<HTMLInputElement>;
  start: () => void;
  abort: () => void;
};

export type TusUploadAction =
  | { type: "start" }
  | { type: "progress"; bytesSent: number; bytesTotal: number }
  | { type: "success"; lastResponse: tus.HttpResponse }
  | { type: "error"; error: Error }
  | { type: "abort" }
  | { type: "setFileList"; fileList: FileList | null };
