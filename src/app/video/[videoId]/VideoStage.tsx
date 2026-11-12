import { ReactNode } from "react";

/**
 * A video page: the player on the dark stage, edge to edge like the front
 * page's, and what there is to read about it on the paper below.
 */
export const VideoStage = ({ player, children }: { player: ReactNode; children: ReactNode }) => (
  <div className="w-full text-foreground">
    <div className="bg-stage">
      <div className="mx-auto max-w-5xl px-0 sm:px-6 sm:py-6">{player}</div>
    </div>
    <div className="mx-auto max-w-5xl space-y-4 px-4 pt-6 sm:px-6">{children}</div>
  </div>
);
