"use client";
import { Button, Form, Input } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserLoginCreate } from "@/generated/user/user";
import type { LoginRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { FormError } from "@/components/form/FormError";

const UserLoginFormSchema = z.object({
  email: z.email("Skriv inn en gyldig e-postadresse."),
  password: z.string().min(1, "Skriv inn passordet ditt."),
});

export default function Login() {
  const router = useRouter();
  const form = useForm<LoginRequest>({
    resolver: zodResolver(UserLoginFormSchema),
  });
  const { register, formState } = form;
  const { mutateAsync } = useUserLoginCreate();

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    await mutateAsync({ data });
    // we force a refresh because profile data is rendered server-side
    router.push("/profile");
    router.refresh();
  });

  return (
    <section className={"w-full max-w-3xl bg-background p-4 rounded-lg shadow-lg mt-10"}>
      <div className={"grid-cols-2 grid gap-8"}>
        <Form onSubmit={onSubmit}>
          <div className={"flex flex-col gap-4 w-full"}>
            <h2 className={"text-lg font-bold"}>Logg inn</h2>
            <FormError error={error} />
            <Input
              {...register("email")}
              id="email"
              isRequired
              label="E-post"
              type="email"
              autoComplete={"username"}
              isInvalid={!!formState.errors.email}
              errorMessage={formState.errors.email?.message}
            />
            <Input
              {...register("password")}
              id="password"
              isRequired
              label="Passord"
              type="password"
              autoComplete={"current-password"}
              isInvalid={!!formState.errors.password}
              errorMessage={formState.errors.password?.message}
            />
            <Button className={"ml-auto"} type="submit" isLoading={isSubmitting}>
              Logg inn
            </Button>
          </div>
        </Form>
        <div className={"space-y-4 flex flex-col justify-between"}>
          <div className={"text-lg"}>...eller registrer deg</div>
          <div className={""}>
            En profil kan brukes til å personalisere din brukeropplevelse. En bruker er også
            nødvendig for å administrere medlemskap.
          </div>
          <div className={"ml-auto"}>
            <Button as={Link} href={"/register"}>
              Registerer bruker
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
