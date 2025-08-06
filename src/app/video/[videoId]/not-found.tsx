"use client";

import { useParams } from "next/navigation";
import { ModalIshPrototype } from "@/app/profile/ModalIshPrototype";
import { Link } from "@heroui/react";

export default function NotFound() {
  const { videoId } = useParams<{ videoId: string }>();
  return (
    <ModalIshPrototype>
      <div className={"p-12 prose-xl"}>
        <h1 className={"text-4xl"}>404 Not Found</h1>
        <p>Ingen videoer eksisterer med ID «{videoId}».</p>
        <Link href="/archive">Til mediearkivet</Link>
      </div>
    </ModalIshPrototype>
  );
}
