"use client";
import { AuthField } from "@/components/form/AuthField";
import { FormError } from "@/components/form/FormError";
import { useUserPasswordResetCreate } from "@/generated/user/user";
import type { PasswordResetRequestRequest } from "@/generated/frikanalenDjangoAPI.schemas";
import { useApiFormSubmit } from "@/lib/useApiFormSubmit";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const PasswordResetRequestSchema = z.object({
  email: z.email("Skriv inn en gyldig e-postadresse."),
});

/** Ask for a reset link. The answer never says whether the address has an account. */
export default function PasswordResetRequestPage() {
  const form = useForm<PasswordResetRequestRequest>({
    resolver: zodResolver(PasswordResetRequestSchema),
  });
  const { register, formState } = form;
  const { mutateAsync } = useUserPasswordResetCreate();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const { onSubmit, error, isSubmitting } = useApiFormSubmit(form, async (data) => {
    await mutateAsync({ data });
    setSentTo(data.email);
  });

  if (sentTo) {
    return (
      <div className={"flex flex-col gap-4"} role="status">
        <h1 className={"text-2xl font-bold"}>Sjekk e-posten din</h1>
        <p>
          Hvis det finnes en bruker med adressen <strong>{sentTo}</strong>, har vi sendt en lenke
          for å velge nytt passord. Lenken virker i én time.
        </p>
        <p>
          Finner du den ikke? Se i søppelpostmappen, eller{" "}
          <button type="button" className={"underline"} onClick={() => setSentTo(null)}>
            prøv igjen
          </button>{" "}
          om noen minutter.
        </p>
        <Link href={"/login"} className={"underline"}>
          Tilbake til innlogging
        </Link>
      </div>
    );
  }

  return (
    <Form onSubmit={onSubmit}>
      <div className={"flex flex-col gap-4 w-full"}>
        <h1 className={"text-2xl font-bold"}>Glemt passordet?</h1>
        <p>
          Skriv inn e-postadressen du logger inn med, så sender vi deg en lenke for å velge et nytt
          passord.
        </p>
        <FormError error={error} />
        <AuthField
          {...register("email")}
          id="email"
          required
          label="E-post"
          type="email"
          autoComplete={"username"}
          isInvalid={!!formState.errors.email}
          errorMessage={formState.errors.email?.message}
        />
        <div className={"flex items-center justify-between gap-4"}>
          <Link href={"/login"} className={"underline"}>
            Tilbake til innlogging
          </Link>
          <Button type="submit" isPending={isSubmitting}>
            Send lenke
          </Button>
        </div>
      </div>
    </Form>
  );
}
