"use client";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserLogoutCreate } from "@/generated/user/user";

export const ProfileButtons = () => {
  const router = useRouter();
  const { mutateAsync } = useUserLogoutCreate();

  return (
    <div className="flex flex-wrap gap-2 py-2">
      <Button as={Link} href={`/profile/edit`}>
        Endre profil
      </Button>
      <Button as={Link} href={`/organization/register`}>
        Registrer ny organisasjon
      </Button>
      <Button
        onPress={() =>
          mutateAsync().then(() => {
            // we force a refresh because profile data is rendered server-side
            router.push("/");
            router.refresh();
          })
        }
      >
        Logg ut
      </Button>
    </div>
  );
};
