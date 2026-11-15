// Teletext key symbols in the style of 1980s TV remotes: a small screen outline, with
// lines of text for teletext, empty for the TV picture, a question mark for reveal and
// half picture, half text for mix. Kept apart from the viewer so the player's
// teletext button doesn't pull the viewer in.

import React from "react";

const Screen = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <rect x="4" y="6" width="24" height="20" rx="3" />
    {children}
  </svg>
);

/** Teletext on: a screen with three lines of text. */
export const TextIcon = ({ className }: { className?: string }) => (
  <Screen className={className}>
    <path d="M9 11.5h14M9 16h14M9 20.5h14" strokeWidth="1.8" />
  </Screen>
);

/** Back to the TV picture: the empty screen. */
export const TvIcon = ({ className }: { className?: string }) => <Screen className={className} />;

/** Reveal concealed text: a question mark on the screen. */
export const RevealIcon = ({ className }: { className?: string }) => (
  <Screen className={className}>
    <path
      d="M12.5 12.5a3.5 3.5 0 1 1 5.2 3c-1.1.7-1.7 1.4-1.7 2.7v.6"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="16" cy="22.3" r="1.2" fill="currentColor" stroke="none" />
  </Screen>
);

/** Mix: text over the picture, split along the diagonal. */
export const MixIcon = ({ className }: { className?: string }) => (
  <Screen className={className}>
    <path d="M9 11h12M9 15h8M9 19h4" strokeWidth="1.6" />
    <path d="M27 8 6 25h19a2 2 0 0 0 2-2z" fill="currentColor" stroke="none" />
  </Screen>
);
