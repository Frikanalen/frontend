"use client";
import { Button } from "@heroui/react";
import { useUserLogoutCreate } from "@/generated/user/user";

export const LogoutButton = () => {
  const { mutateAsync } = useUserLogoutCreate();
  return (
    <Button
      onPress={async () => {
        await mutateAsync();
        window.location.assign("/");
      }}
    >
      Logg ut
    </Button>
  );
};
