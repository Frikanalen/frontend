import { useCallback, useMemo, useReducer, useRef } from "react";
import * as tus from "tus-js-client";
import {
  tusUploadInitialState,
  tusUploadReducer,
  TusUploadState,
} from "./tusUploadReducer";

export interface UseTusUploadReturn extends TusUploadState {
  setFileList: (_fileList: FileList | null) => void;
  start: () => void;
  abort: () => void;
}

const useTusUploadState = () => {
  const [state, dispatch] = useReducer(tusUploadReducer, tusUploadInitialState);
  const file = state.file;

  const onError = (error: Error | tus.DetailedError) => {
    dispatch({ type: "error", error });
  };

  const onSuccess: (_payload: tus.OnSuccessPayload) => void = () =>
    dispatch({
      type: "success",
      message: null,
    });

  const onProgress = (bytesSent: number, bytesTotal: number) => {
    dispatch({
      type: "progress",
      percent: Math.floor((bytesSent / bytesTotal) * 100),
    });
  };

  return {
    state,
    dispatch,
    file,
    uploadHooks: { onError, onSuccess, onProgress },
  };
};

const buildMetadata = (
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

export function useTusUpload(
  videoId: string,
  uploadToken: string,
): UseTusUploadReturn {
  const uploadRef = useRef<tus.Upload | null>(null);
  const { state, dispatch, file, uploadHooks } = useTusUploadState();

  const endpoint = "http://localhost:1080/files/";

  useMemo(() => {
    if (!file) return;
    const metadata = buildMetadata(file, videoId, uploadToken);
    uploadRef.current = new tus.Upload(file, {
      endpoint,
      metadata,
      ...uploadHooks,
    });
  }, [file, videoId, uploadToken, uploadHooks]);

  const start = useCallback(() => {
    if (!uploadRef.current) return;
    dispatch({ type: "start" });
    uploadRef.current.start();
  }, [dispatch]);

  const abort = useCallback(() => {
    uploadRef.current?.abort(true);
    uploadRef.current = null;
    dispatch({ type: "abort" });
  }, [dispatch]);

  const setFileList = useCallback(
    (fileList: FileList | null) => {
      abort();
      dispatch({ type: "setFileList", fileList });
    },
    [dispatch, abort],
  );

  return { setFileList, start, abort, ...state };
}
