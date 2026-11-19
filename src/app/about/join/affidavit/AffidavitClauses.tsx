import Link from "next/link";
import { AFFIDAVIT_CLAUSES } from "@/app/about/join/affidavit/clauses";

/** The editor's declaration as a numbered list, from the one shared text. */
export const AffidavitClauses = ({ className }: { className?: string }) => (
  <ol className={className}>
    {AFFIDAVIT_CLAUSES.map((clause, index) => (
      <li key={index}>
        {typeof clause === "string" ? (
          clause
        ) : (
          <>
            {clause.before}
            <Link href={clause.link.href}>{clause.link.text}</Link>
            {clause.after}
          </>
        )}
      </li>
    ))}
  </ol>
);
