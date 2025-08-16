"use client";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useUserLogoutCreate } from "@/generated/user/user";

export const ProfileButtons = () => {
  const { mutateAsync } = useUserLogoutCreate();

  return (
    <div className="flex gap-2 py-2">
      <Button as={Link} href={`/profile/edit`}>
        Endre profil
      </Button>
      <Button as={Link} href={`/organization/register`}>
        Registrer ny organisasjon
      </Button>
      <Button onPress={() => mutateAsync().then(() => window.location.assign("/"))}>Logg ut</Button>
    </div>
  );
};
