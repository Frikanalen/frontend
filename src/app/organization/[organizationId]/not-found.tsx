"use client";

import { useParams } from "next/navigation";

export default function NotFound() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return (
    <div className="prose-sm lg:prose-xl p-20">
      <h2>404: Not Found</h2>
      <p>Vi beklager &mdash; «{organizationId}» er ikke ID-nummeret til en aktiv organisasjon.</p>
    </div>
  );
}
