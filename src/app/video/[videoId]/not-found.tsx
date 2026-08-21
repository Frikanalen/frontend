"use client";

import { useParams } from "next/navigation";
import { PageShell, PageShellBody } from "@/components/layout/PageShell";
import { Link } from "@heroui/react";

export default function NotFound() {
  const { videoId } = useParams<{ videoId: string }>();
  return (
    <PageShell>
      <PageShellBody aspectVideo className={"justify-between flex flex-col"}>
        <div className="prose-sm lg:prose-xl">
          <h2>404 Not Found</h2>
          <p>Det er bare å beklage &mdash; video «{videoId}» er ikke å oppdrive.</p>
        </div>
        <div className="flex justify-end">
          <Link href="/video">Til mediearkivet</Link>
        </div>
      </PageShellBody>
    </PageShell>
  );
}
