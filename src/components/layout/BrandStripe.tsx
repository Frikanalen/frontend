/**
 * The logo's three wings as a thin stripe: coral, amber, green. It is the one
 * place the three colours appear together - everywhere else each is used
 * alone, for the one thing it stands for.
 */
export const BrandStripe = () => (
  <div aria-hidden className="flex h-1 w-full">
    <div className="grow bg-brand-coral" />
    <div className="grow bg-brand-amber" />
    <div className="grow bg-brand-leaf" />
  </div>
);
