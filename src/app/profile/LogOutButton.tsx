"use client";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { GoSignOut } from "react-icons/go";
import { useUserLogoutCreate } from "@/generated/user/user";

/**
 * The one control on this page that is a button rather than a link: it
 * performs an action, and where you end up depends on whether that action
 * succeeded.
 *
 * `mutate` rather than `mutateAsync` so a rejected logout stays inside
 * react-query — the old version chained `.then()` onto the promise, which both
 * left the rejection unhandled and made a failed sign-out look like a dead
 * button, since the only branch it had led to the redirect.
 */
export const LogOutButton = () => {
  const router = useRouter();
  const { mutate, isPending, isError } = useUserLogoutCreate({
    mutation: {
      onSuccess: () => {
        // Profile data is rendered on the server, so the cached tree has to go
        // with the session; a push on its own would leave the signed-in header
        // in place.
        router.push("/");
        router.refresh();
      },
    },
  });

  return (
    <div className="flex flex-col items-stretch gap-2">
      {/* justify-start so the label lines up with "Endre profil" directly
          above it: HeroUI centres button content, which left the two labels
          on different x-positions in the same little stack. */}
      <Button
        variant="light"
        className="justify-start px-4"
        isLoading={isPending}
        startContent={isPending ? undefined : <GoSignOut aria-hidden="true" />}
        onPress={() => mutate()}
      >
        Logg ut
      </Button>
      {isError && (
        <p role="alert" className="text-danger-700 text-sm">
          Utloggingen gikk ikke gjennom. Prøv igjen.
        </p>
      )}
    </div>
  );
};
