import { cache } from "react";
import { AxiosHeaders } from "axios";
import { userRetrieve } from "@/generated/user/user";

// The root layout, the organisation layout and most pages each want the user,
// and they render concurrently for the same request. userRetrieve goes through
// axios, which Next's fetch deduplication never sees, so without this every
// page view asked Django for the same session two or three times. React's
// cache() lasts for one server request; keying it on the cookie string (rather
// than the headers object, which is new on every call) makes the callers share
// one /api/user call.
const userForCookie = cache(async (cookie: string) => {
  try {
    const res = await userRetrieve({ headers: cookie ? { Cookie: cookie } : {} });
    return res.data;
  } catch {
    return null;
  }
});

export const getUserOrNull = (headers: AxiosHeaders) =>
  userForCookie(String(headers.get("Cookie") ?? ""));
