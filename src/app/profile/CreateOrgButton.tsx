"use client";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

export const CreateOrgButton = () => {
  const router = useRouter();
  return (
    <Button onPress={() => router.push("/organization/register")}>Registrer ny organisasjon</Button>
  );
};
