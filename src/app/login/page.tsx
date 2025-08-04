"use client";
import { Button, Form, Input } from "@heroui/react";
import Link from "next/link";
import { useActionState } from "react";
import { obtainTokenCreate } from "@/generated/obtain-token/obtain-token";

type State = { error?: string };

type UserLoginForm = {
  username: string;
  password: string;
};

export default function Login() {
  const [{ error }, formAction] = useActionState<State, UserLoginForm>(
    async (state: State, payload: UserLoginForm): Promise<State> => {
      const token = await obtainTokenCreate({
        username: payload.username,
        password: payload.password,
      });
      return { ...state, error: token.data.token };
    },
    {
      error: "foo",
    },
  );

  return (
    <div className={"grid-cols-2 grid gap-4"}>
      <div className={"space-y-4"}>
        <h2 className={"text-lg font-bold"}>Logg inn</h2>
        <Form action={formAction}>
          <Input
            isRequired
            name="username"
            label="E-post"
            type="email"
            autoComplete={"username"}
          />
          <Input
            isRequired
            name="password"
            label="Passord"
            type="password"
            autoComplete={"password"}
          />
          <pre>{JSON.stringify(error, null, 2)}</pre>
          <Button className={"ml-auto"} type="submit">
            Logg inn
          </Button>
        </Form>
      </div>
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
