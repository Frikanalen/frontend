"use client";
import { useEffect, useRef, useState } from "react";

/** What the preview frame shows: a text poster or a bulletin on the slate. */
export type ScreenPreviewContent = {
  kind: "poster" | "bulletin";
  template: string;
  heading: string;
  text: string;
  /** Which page to hold, from 0. */
  page: number;
  /** Text posters: light by day, dark by night. */
  look?: "day" | "night";
  /** Text posters: the organization it is from. */
  from?: string;
};

/** The address of the on-air graphics, held on one page of the text. */
export const previewUrl = (content: ScreenPreviewContent) => {
  const shared = {
    dev: "false",
    heading: content.heading,
    text: content.text,
    slide: String(content.page),
  };
  return `/graphics/?${new URLSearchParams(
    content.kind === "poster"
      ? {
          ...shared,
          poster: content.template,
          from: content.from ?? "",
          look: content.look ?? "day",
        }
      : // The slate is drawn without WebGL here: one picture, no movement.
        { ...shared, view: "slate", renderer: "dom", template: content.template },
  )}`;
};

const message = (content: ScreenPreviewContent) => ({
  type: "fk-preview",
  heading: content.heading,
  text: content.text,
  template: content.template,
  slide: content.page,
  look: content.look,
  from: content.from,
});

/**
 * The on-air graphics themselves, in a frame, showing one page of the text
 * as it will air: the same code, typeface and line breaks as on television.
 * The frame is loaded once; after that the text is posted to it as it is
 * typed (previewChannel.ts in on-air-graphics), so it follows every
 * keystroke without flickering.
 */
export const ScreenPreview = ({
  content,
  title,
}: {
  content: ScreenPreviewContent;
  title: string;
}) => {
  const frame = useRef<HTMLIFrameElement>(null);
  // The kind decides which page of the graphics is loaded; the rest is posted.
  const [src] = useState(() => previewUrl(content));
  const latest = useRef(content);

  useEffect(() => {
    latest.current = content;
    frame.current?.contentWindow?.postMessage(message(content), window.location.origin);
  }, [content]);

  // The graphics say when they are ready to listen; what was typed while
  // they loaded is sent then.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frame.current?.contentWindow) return;
      if ((event.data as { type?: string } | null)?.type !== "fk-preview-ready") return;
      frame.current?.contentWindow?.postMessage(message(latest.current), window.location.origin);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-default-300 bg-default-100">
      <iframe
        // Out of the flow: at 1280px it must not widen the page on a phone.
        className="pointer-events-none absolute top-0 left-0 h-[720px] w-[1280px] max-w-none origin-top-left"
        data-look={content.look}
        data-page={content.page}
        data-template={content.template}
        ref={(element) => {
          frame.current = element;
          const box = element?.parentElement;
          if (!element || !box) return;
          // Drawn at 1280x720 and scaled to its box, like a television picture.
          const fit = () =>
            element.style.setProperty("--screen-scale", String(box.clientWidth / 1280));
          fit();
          const observer = new ResizeObserver(fit);
          observer.observe(box);
          return () => observer.disconnect();
        }}
        src={src}
        style={{ transform: "scale(var(--screen-scale))" }}
        tabIndex={-1}
        title={title}
      />
    </div>
  );
};
