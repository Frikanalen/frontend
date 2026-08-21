import { headers } from "next/headers";
import { AxiosHeaders } from "axios";

/**
 * Gets cookies from next/headers and packages them as AxiosHeaders.
 * Can only be used in async page context.
 **/
export const getCookiesFromRequest = async () => {
  const incomingHeaders = await headers();
  const cookieHeader = incomingHeaders.get("Cookie");

  const requestHeader = new AxiosHeaders();
  requestHeader.set("Cookie", cookieHeader);
  return requestHeader;
};
