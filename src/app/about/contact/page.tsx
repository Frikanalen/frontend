import Link from "next/link";

export default async function Contact() {
  return (
    <div className="prose dark:prose-invert prose-lg max-w-none">
      <h2>Kontaktinformasjon</h2>
      <p>
        Styreleder Tom Fredrik Blenning kan nås på{" "}
        <Link href="mailto:post@frikanalen.tv">post@frikanalen.tv</Link>
      </p>
      <p>
        Teknisk leder Tore Sinding Bekkedal kan nås på{" "}
        <Link href="mailto:toresbe@protonmail.com">toresbe@protonmail.com</Link>
      </p>
    </div>
  );
}
