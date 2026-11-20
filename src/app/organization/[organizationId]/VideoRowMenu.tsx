"use client";
import { useRouter } from "next/navigation";
import { Button, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import type { Video } from "@/generated/frikanalenDjangoAPI.schemas";

/**
 * The things one does to a video besides editing it, which is what the row
 * itself is for. Deleting sits here rather than as a red button on every row:
 * it cannot be undone and is rarely what anyone came to do.
 */
export const VideoRowMenu = ({
  video,
  onDelete,
  isDeleting = false,
}: {
  video: Pick<Video, "id" | "name">;
  onDelete: () => void;
  isDeleting?: boolean;
}) => {
  const router = useRouter();
  return (
    <MenuTrigger>
      <Button
        aria-label={`Mer for «${video.name}»`}
        className="grid size-9 cursor-pointer place-items-center rounded-md text-xl leading-none text-default-600 outline-focus hover:bg-default-100 hover:text-foreground focus-visible:outline-2"
        isDisabled={isDeleting}
      >
        <span aria-hidden>⋯</span>
      </Button>
      <Popover
        className="min-w-48 border border-default-300 bg-background text-foreground shadow-xl"
        placement="bottom end"
      >
        <Menu
          aria-label={`Valg for «${video.name}»`}
          className="py-1 outline-none"
          onAction={(key) => {
            if (key === "view") router.push(`/video/${video.id}`);
            if (key === "delete") onDelete();
          }}
        >
          <MenuItem
            className="cursor-pointer px-4 py-2 outline-none data-[focused]:bg-default-100"
            id="view"
          >
            Se offentlig side
          </MenuItem>
          <MenuItem
            className="cursor-pointer px-4 py-2 text-danger outline-none data-[focused]:bg-default-100"
            id="delete"
          >
            Slett videoen
          </MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
};
