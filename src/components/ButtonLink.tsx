import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";
import cx from "classnames";

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    size?: "sm" | "md" | "lg";
  };

/** A Next.js link styled like HeroUI's primary button. */
export const ButtonLink = ({ className, size = "md", ...props }: ButtonLinkProps) => (
  <Link
    className={cx(
      "inline-flex w-fit items-center justify-center rounded-lg bg-accent px-4 font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
      size === "sm" ? "min-h-8 text-sm" : size === "lg" ? "min-h-12 text-lg" : "min-h-10",
      className,
    )}
    {...props}
  />
);
