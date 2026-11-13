"use client";
import { mergeMemberships, studioHref } from "@/app/profile/studio";
import type { User } from "@/generated/frikanalenDjangoAPI.schemas";
import cx from "classnames";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";

/**
 * The way into the member tools, from anywhere on the site. Most users
 * belong to one organization, and for them this is a plain link straight to
 * it. With several it opens a menu of them. Someone in no organization has
 * no Studio yet, and gets nothing here.
 */
export const StudioButton = ({ user }: { user: Pick<User, "memberOf" | "editorOf"> }) => {
  const path = usePathname();
  const router = useRouter();
  const memberships = mergeMemberships(user.memberOf, user.editorOf);
  const current = Number(/^\/organization\/(\d+)\/./.exec(path)?.[1]);
  const inStudio = memberships.some(({ id }) => id === current);
  const className = cx(
    "rounded-md border px-3 py-1.5 font-semibold whitespace-nowrap text-stage-foreground outline-focus focus-visible:outline-2 focus-visible:outline-offset-2",
    inStudio ? "border-brand-green" : "border-stage-foreground/40 hover:border-stage-foreground",
  );

  if (memberships.length === 0) return null;
  if (memberships.length === 1) {
    return (
      <Link
        aria-current={inStudio ? "page" : undefined}
        className={className}
        href={studioHref(memberships[0].id)}
      >
        Studio
      </Link>
    );
  }

  return (
    <MenuTrigger>
      <Button className={cx(className, "inline-flex cursor-pointer items-center gap-1.5")}>
        Studio <span aria-hidden>▾</span>
      </Button>
      <Popover
        className="min-w-56 border border-default-300 bg-background text-foreground shadow-xl"
        placement="bottom end"
      >
        <Menu
          aria-label="Velg organisasjon"
          className="py-1 outline-none"
          onAction={(key) => router.push(String(key))}
        >
          {memberships.map(({ id, name, isEditor }) => (
            <MenuItem
              className={cx(
                "flex cursor-pointer items-baseline justify-between gap-4 px-4 py-2 outline-none data-[focused]:bg-default-100",
                id === current && "font-semibold",
              )}
              id={studioHref(id)}
              key={id}
              textValue={name}
            >
              {name}
              <span className="text-xs font-normal text-default-600">
                {isEditor ? "Redaktør" : "Medlem"}
              </span>
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
};
