"use client";

import cx from "classnames";
import { DragEvent, useRef, useState } from "react";
import { FiFilm, FiUploadCloud } from "react-icons/fi";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

export const VideoFileDropzone = ({
  file,
  onFileChange,
  isDisabled = false,
}: {
  file: File | null;
  onFileChange: (_file: File | null) => void;
  isDisabled?: boolean;
}) => {
  const input = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setDragging] = useState(false);

  const openFilePicker = () => {
    if (isDisabled || !input.current) return;
    input.current.value = "";
    input.current.click();
  };

  const onDragEnter = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isDisabled) return;
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isDisabled) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (isDisabled) return;
    onFileChange(event.dataTransfer.files[0] ?? null);
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium" id="video-file-label">
        Videofil
      </span>
      <input
        ref={input}
        type="file"
        hidden
        disabled={isDisabled}
        onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
      />
      <button
        type="button"
        aria-labelledby="video-file-label"
        disabled={isDisabled}
        onClick={openFilePicker}
        onDragEnter={onDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cx(
          "group flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          isDragging
            ? "border-primary bg-primary-50 text-primary dark:bg-primary-950/30"
            : "border-default-300 bg-default-50 hover:border-primary-400 hover:bg-default-100",
          isDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        {file ? (
          <>
            <span className="rounded-full bg-success-100 p-3 text-success-700 dark:bg-success-900/40 dark:text-success-300">
              <FiFilm aria-hidden className="size-6" />
            </span>
            <span className="max-w-full truncate font-semibold">{file.name}</span>
            <span className="text-sm text-foreground-500">
              {formatFileSize(file.size)} · Klikk eller slipp en annen fil her for å bytte
            </span>
          </>
        ) : (
          <>
            <span className="rounded-full bg-primary-100 p-3 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              <FiUploadCloud aria-hidden className="size-6" />
            </span>
            <span className="font-semibold">Slipp videofilen her</span>
            <span className="text-sm text-foreground-500">eller klikk for å velge en fil</span>
          </>
        )}
      </button>
    </div>
  );
};
