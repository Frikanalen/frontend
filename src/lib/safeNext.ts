/**
 * Where to go after logging in: a `next` path on this site, such as an
 * invitation link, or Min side. Only same-site paths, so the parameter
 * cannot send anyone elsewhere.
 */
export const safeNext = (search: string) => {
  const next = new URLSearchParams(search).get("next") ?? "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/profile";
};
