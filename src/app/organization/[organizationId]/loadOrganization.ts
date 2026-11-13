import { cache } from "react";
import { headers } from "next/headers";
import { ssrOrganizationRetrieve } from "@/generated/ssr/organization/organization";

const retrieve = cache((organizationId: number, cookie: string) =>
  ssrOrganizationRetrieve(organizationId, {
    headers: cookie ? { Cookie: cookie } : {},
    cache: "no-store",
  }),
);

/**
 * The organisation as the visitor may see it. The organisation layout, the
 * page and its metadata all need it for the same request, and asking Django
 * once instead of three times is the difference between one round trip and
 * three before the page can render.
 */
export const loadOrganization = async (organizationId: number) =>
  retrieve(organizationId, (await headers()).get("cookie") ?? "");
