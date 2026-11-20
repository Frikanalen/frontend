import type { Metadata } from "next";
import Link from "next/link";
import { getUserOrNull } from "@/app/getUserOrNull";
import { InvitationAccept } from "@/app/invitation/[token]/InvitationAccept";
import { ssrInvitationsRetrieve } from "@/generated/ssr/invitations/invitations";
import { getCookiesFromRequest } from "@/lib/getCookiesFromRequest";

// Per-visitor: rendered on request, without a static shell of its own.
export const instant = false;

export const metadata: Metadata = { title: "Invitasjon - Frikanalen", robots: { index: false } };

/**
 * Where the link in an invitation e-mail lands. Logged in, you join with
 * one button. Without an account you make one here, with the invited
 * address, and join in the same step; with an account you log in and come
 * back.
 */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headers = await getCookiesFromRequest();
  const [user, preview] = await Promise.all([
    getUserOrNull(headers),
    ssrInvitationsRetrieve(token, { headers, cache: "no-store" }),
  ]);

  return (
    <main className="mx-4 mt-10 w-[calc(100%-2rem)] max-w-xl bg-background p-6 sm:p-8">
      {preview.status === 200 ? (
        <InvitationAccept
          token={token}
          invitation={preview.data}
          user={user ? { email: user.email } : null}
        />
      ) : (
        <>
          <h1 className="text-2xl font-bold">Invitasjonen virker ikke</h1>
          <p className="mt-2 text-default-700">
            Den er allerede brukt, trukket tilbake eller har gått ut. Be redaktøren i organisasjonen
            om å sende en ny.
          </p>
          <Link className="mt-4 inline-block text-link hover:underline" href="/">
            Til forsiden
          </Link>
        </>
      )}
    </main>
  );
}
