"use client";
import { useEffect } from "react";

/**
 * Asks before the page is left with unsaved changes: on reload, closing the
 * tab, and following a link inside the site. The App Router has no event for
 * the last one, so link clicks are caught on the document instead.
 */
export const useUnsavedChangesWarning = (isDirty: boolean, message: string) => {
  useEffect(() => {
    if (!isDirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      // A new tab or window leaves this page where it is.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank") return;
      if (link.origin !== window.location.origin) return;
      if (link.pathname === window.location.pathname && link.hash) return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, [isDirty, message]);
};
