import { ChangeEventHandler, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import * as tus from "tus-js-client";
import { UploadOptions } from "tus-js-client";
import { tusUploadInitialState, tusUploadReducer } from "./tusUploadReducer";
import { UseTusUploadReturn } from "@/lib/upload/types";
import { buildUploadMetadata } from "@/lib/upload/buildUploadMetadata";

export function useTusUpload(
  videoId: string,
  uploadToken: string,
  endpoint: string,
): UseTusUploadReturn {
  const uploadRef = useRef<tus.Upload | null>(null);
  const [state, dispatch] = useReducer(tusUploadReducer, tusUploadInitialState);

  const uploadHooks = useMemo<Pick<UploadOptions, "onError" | "onProgress" | "onSuccess">>(
    () => ({
      onError: (error) => dispatch({ type: "error", error }),
      onProgress: (bytesSent, bytesTotal) => dispatch({ type: "progress", bytesSent, bytesTotal }),
      onSuccess: ({ lastResponse }) => dispatch({ type: "success", lastResponse }),
    }),
    [dispatch],
  );

  useEffect(() => {
    if (!state.file) return;
    const metadata = buildUploadMetadata(state.file, videoId, uploadToken);
    uploadRef.current = new tus.Upload(state.file, {
      endpoint,
      metadata,
      ...uploadHooks,
    });
    return () => {
      // Abort when file/endpoint/metadata change or on unmount
      uploadRef.current?.abort(false);
      uploadRef.current = null;
    };
  }, [state.file, videoId, uploadToken, endpoint, uploadHooks]);

  const start = useCallback(() => {
    if (!uploadRef.current) return;
    if (state.isUploading) return;
    dispatch({ type: "start" });
    uploadRef.current.start();
  }, [dispatch, state.isUploading]);

  const abort = useCallback(() => {
    uploadRef.current?.abort(true);
    uploadRef.current = null;
    dispatch({ type: "abort" });
  }, [dispatch]);

  const onFileListChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      abort();
      dispatch({ type: "setFileList", fileList: event.target.files });
    },
    [dispatch, abort],
  );

  return { onFileListChange, start, abort, ...state };
}
