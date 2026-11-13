import { cache } from "react";
import { headers } from "next/headers";
import { AxiosHeaders } from "axios";
import { getUserOrNull } from "@/app/getUserOrNull";

/**
 * Django's session cookie. A request without one belongs to a visitor, and
 * asking Django who they are would only get a 403 back.
 */
const SESSION_COOKIE = /(?:^|;\s*)sessionid=/;

/**
 * The signed-in user for this request, or null for a visitor.
 *
 * Shared by everything in one render (React cache), and it skips Django
 * entirely for the large majority of requests that carry no session at all.
 * It reads the request's headers, so anything awaiting it is per-visitor and
 * belongs behind <Suspense> on a page that is otherwise cached.
 */
export const getCurrentUser = cache(async () => {
  const cookie = (await headers()).get("Cookie");
  if (!cookie || !SESSION_COOKIE.test(cookie)) return null;

  const requestHeaders = new AxiosHeaders();
  requestHeaders.set("Cookie", cookie);
  return getUserOrNull(requestHeaders);
});
