"use client";

import { useParams } from "next/navigation";
import { ModalIshPrototype, ModalIshPrototypeBody } from "@/app/profile/ModalIshPrototype";
import { Link } from "@heroui/react";

export default function NotFound() {
  const { videoId } = useParams<{ videoId: string }>();
  return (
    <ModalIshPrototype>
      <ModalIshPrototypeBody className={"justify-between border-2 flex flex-col"}>
        <div className="prose-sm lg:prose-xl">
          <h2>404 Not Found</h2>
          <p>Det er bare å beklage &mdash; video «{videoId}» er ikke å oppdrive.</p>
        </div>
        <div className="flex justify-end">
          <Link href="/archive">Til mediearkivet</Link>
        </div>
      </ModalIshPrototypeBody>
    </ModalIshPrototype>
  );
}
