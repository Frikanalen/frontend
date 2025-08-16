"use client";

import { UserRegisterForm } from "@/app/register/UserRegisterForm";

export default function Register() {
  return (
    <section className={"w-full flex flex-col lg:flex-row"}>
      <div className={"prose dark:prose-invert basis-1/3 shrink-0"}>
        <h2>Registrer deg</h2>
      </div>
      <UserRegisterForm
        className={"max-lg:max-w-xl w-full border-4 border-primary-100 ml-4 p-4 rounded-lg"}
      />
    </section>
  );
}
