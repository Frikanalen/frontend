"use client";

import { UserRegisterForm } from "@/app/register/UserRegisterForm";

export default function Register() {
  return (
    <section className={"w-full flex flex-col lg:flex-row"}>
      <div className={"prose dark:prose-invert basis-1/3 shrink-0"}>
        <h2>Registrer deg</h2>
      </div>
      <UserRegisterForm className={"w-full max-lg:max-w-xl"} />
    </section>
  );
}
