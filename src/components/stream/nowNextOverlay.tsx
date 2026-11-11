// The live badge, drawn over the still player. What is on now and next is
// listed beside the player rather than on top of it, so the frame itself
// stays clear for the picture and the play button.
//
// It takes no pointer events: anywhere the viewer clicks should still start
// the stream.
export const LiveBadge = () => (
  <div className="pointer-events-none absolute inset-0 z-50">
    <div className="m-3 inline-flex items-center gap-2 rounded-xs bg-stage px-2.5 py-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-coral/70 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-coral" />
      </span>
      <span className="text-[0.7rem] font-bold tracking-[0.14em] text-stage-foreground uppercase">
        Direkte
      </span>
    </div>
  </div>
);
