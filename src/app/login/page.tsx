"use client";
import { Button, Form, Input } from "@heroui/react";
import Link from "next/link";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserLoginCreate } from "@/generated/user/user";
import { useRouter } from "next/navigation";

const UserLoginFormSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export default function Login() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(UserLoginFormSchema),
  });
  const router = useRouter();
  const { mutateAsync } = useUserLoginCreate();

  return (
    <div className={"grid-cols-2 grid gap-8"}>
      <Form
        onSubmit={handleSubmit(async (data) =>
          mutateAsync({ data }).then(() => router.push("/profile")),
        )}
      >
        <div className={"flex flex-col gap-4 w-full"}>
          <h2 className={"text-lg font-bold"}>Logg inn</h2>
          <Controller
            control={control}
            name={"email"}
            render={({ field }) => (
              <Input
                isRequired
                label="E-post"
                type="email"
                autoComplete={"username"}
                {...field}
              />
            )}
          />
          <Controller
            control={control}
            name={"password"}
            render={({ field }) => (
              <Input
                label="Passord"
                type="password"
                autoComplete={"password"}
                {...field}
              />
            )}
          />
          <Button className={"ml-auto"} type="submit">
            Logg inn
          </Button>
        </div>
      </Form>
      <div className={"space-y-4 flex flex-col justify-between"}>
        <div className={"text-lg"}>...eller registrer deg</div>
        <div className={""}>
          En profil kan brukes til å personalisere din brukeropplevelse. En
          bruker er også nødvendig for å administrere medlemskap.
        </div>{" "}
        <Link href={"/register"}>
          <Button className={"ml-auto"} href={"/register"}>
            Registerer bruker
          </Button>
        </Link>
      </div>
    </div>
  );
}
